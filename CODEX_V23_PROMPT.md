# v23 実装指示（童話キャラ16タイプ診断）

対象ファイルは **index.html のみ**。他のファイルは変更しない。文章の中身・数値・診断ロジック・データ（AXES／FAMILIES／TYPES／QUESTIONS 等）・タグ文字列は一切変えない。

## ① シェアで文章が自動で入るようにする

現行の問題：`navigator.share({files, title, text, url})` の形だと iPhone 実機で画像と URL だけが X に届き、文章とタグが落ちた。

変更は次の3点だけ：

1. `shareTextFor(code)` の返す文字列に、文章＋URL＋タグ3つを全文含める。形は次と文字単位で一致させる（SHARE_SITE_URL と SHARE_HASHTAGS は既存定数をそのまま使う）：
   ```js
   function shareTextFor(code) { return `童話キャラ16タイプ診断で、私は『${TYPES[code].name}』でした。 ${SHARE_SITE_URL} ${SHARE_HASHTAGS}`; }
   ```
2. `shareResult` 内の files 共有を `{files, text}` のみに変える（title と url は渡さない）：
   ```js
   await navigator.share({ files: [file], text: shareTextFor(code) });
   ```
3. files が使えない環境では、テキストのみ共有を `{text}` のみで試み、それも使えない／失敗した場合にだけ現行の showFallback() を出す。具体的には現行の `} else showFallback();` を次に置き換える：
   ```js
   } else if (navigator.share) {
     try {
       await navigator.share({ text: shareTextFor(code) });
       if (status.isConnected) status.textContent = '共有シートを開きました。';
     } catch (textError) {
       if (textError.name === 'AbortError') { if (status.isConnected) status.textContent = ''; }
       else showFallback();
     }
   } else showFallback();
   ```
   ただし外側の try/catch の構造（AbortError の扱い・finally の button.disabled 復帰）は現行のまま崩さないこと。上記は canShare(files) が false の分岐の置き換えとして組み込むこと。

- `shareIntentHref` は**一切変更しない**（現行維持）。
- クリップボードにコピーして貼らせる方式は禁止。copyResult も変更しない。

## ② 結果画面の見出し・魅せ方の強化（「4つの診断軸」まわりだけ）

世界観の正：v17 の水彩絵本。明朝（var(--mincho)）・金・深いインク色。丸っこいポップ風に寄せない。絵をコードで描かない（装飾はタイポグラフィ・色・罫のみ）。

### HTML 側の最小変更（体裁付け専用。表示文字列は変えない）
- detailHTML の診断軸セクション（`style="--chapter:1"` の section）に class を足す：`<section class="section axes-section" style="--chapter:1">`。
- axesHTML の各軸見出しで、番号部分を `<span class="axis-num">1</span>` のように包む（「. 」と名前の文字列自体は変えない。例：`<span><span class="axis-num">${index + 1}</span>. ${axis.name}</span>`）。
- axesHTML の axis-labels の各 pole の外側 span に、勝敗クラスを付ける：personal の場合は percent で勝っている側（pole0 は percent>=50、pole1 は percent<50。同点50の時は両方付けない）、personal でない場合は winner 側に `is-winner`、反対側に `is-loser` を付ける。テキスト・% の計算式は現行のまま変えない。

### CSS 側の変更
`<style>` の末尾（V17 ブロックの後）に V23 ブロックを**追加**するだけにし、既存規則は書き換えない。内容：

```css
/* V23: axes chapter headings — storybook chapter titles, gold + deep ink. */
.axes-section { --v23-gold: #b08d3f; --v23-gold-soft: rgba(176,141,63,.35); --v23-ink: #2b2440; --v23-muted: #6f6a85; }
.axes-section > h2 { font-family: var(--mincho); font-size: 30px; line-height: 1.5; letter-spacing: .06em; color: var(--v23-ink); text-align: center; margin-bottom: 10px; padding-bottom: 14px; border-bottom: 3px double var(--v23-gold); }
.axes-section .diagram-title { font-family: var(--mincho); font-size: 22px; letter-spacing: .05em; color: var(--v23-ink); padding-bottom: 8px; border-bottom: 1px solid var(--v23-gold-soft); }
.axes-section .radar-pole strong, .axes-section .radar-legend strong { font-size: 19px; color: var(--v23-ink); }
.axes-section .axis { margin-top: 40px; padding-top: 28px; border-top: 1px solid var(--v23-gold-soft); }
.axes-section .axis:first-of-type { border-top: 0; }
.axes-section .axis-top { font-family: var(--mincho); font-size: 20px; letter-spacing: .03em; color: var(--v23-ink); }
.axes-section .axis-num { color: var(--v23-gold); font-size: 24px; margin-right: 2px; }
.axes-section .close-badge { background: rgba(176,141,63,.12); border: 1px solid var(--v23-gold); border-radius: 3px; color: var(--v23-ink); font-family: var(--mincho); padding: 4px 10px; }
.axes-section .axis-labels .is-winner .axis-pole { color: var(--v23-ink); font-size: 17px; }
.axes-section .axis-labels .is-winner strong { font-size: 32px; font-family: var(--mincho); color: var(--family-deep); line-height: 1.3; }
.axes-section .axis-labels .is-loser { color: var(--v23-muted); }
.axes-section .axis-labels .is-loser .axis-pole { font-weight: 400; }
.axes-section .axis-labels .is-loser strong { font-size: 20px; color: var(--v23-muted); }
@media (max-width: 400px) { .axes-section > h2 { font-size: 27px; } .axes-section .axis-labels .is-winner strong { font-size: 29px; } }
```

注：`.axis:first-of-type` が効かない構造なら無理に直さず、その行は落として報告に書くこと（推測でセレクタを増やさない）。

## 完了条件
- index.html のみ変更。変更箇所は ①の shareTextFor／shareResult、②の detailHTML の section class、axesHTML の番号包みと勝敗クラス、CSS 末尾の V23 ブロック追加だけ。
- 作業後に V23_BUILD_REPORT.md を作り、変更箇所（行単位の要約）と、触っていないこと（診断ロジック・データ・文章・shareIntentHref・copyResult）を明記する。
- git 操作・push はしない。
