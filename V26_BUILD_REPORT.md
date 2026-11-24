# V26_BUILD_REPORT

2026-11-24 JST。[CODEX_V26_PROMPT.md](CODEX_V26_PROMPT.md) に従い、[index.html](index.html) の `<style>` 末尾へ V26 ブロックを追加した。

**実装保存・ソース照合・全 script の構文検査は完了。390×844 で共有ボタン全体が見えることと、ヒーローの実際の見栄えは未検証。** ブラウザ表示が自動承認レビューに拒否されたため、目標達成・視覚品質の合格とは判定していない。本報告はクロエ向けの実装結果であり、本人採用・公開完了を意味しない。

## 変更内容と狙いの削減量

index.html の695–702行へ、コメント1行と CSS 規則7個（計703バイト）を追加した。既存の CSS 規則は書き換えていない。

ヒーローの全規則を `.result-card:has(> .share-actions) > .result-hero` に限定した。結果と図鑑詳細は同じ `.result-hero` を使うため、直下に `.share-actions` がある結果カードだけを対象にする。図鑑詳細・トップ・図鑑一覧・質問画面にはこの条件が成立しない。

以下の値と削減量は、既存 CSS と追加 CSS からの計算であり、ブラウザ実測ではない。390px 幅では既存 `.result-card` が `100vw`、絵は縦横比1:1のため、絵の幅と高さをともに390pxから273pxへ変更する設定になる。

| 対象（上記の結果ヒーローに限定） | v25 → v26 | 狙いの縦削減量 |
| --- | --- | --- |
| `.result-hero` の padding | 上28px・下54px → 上8px・下16px。左右0は維持 | 58px |
| `.result-kicker` の margin | `8px 16px 12px` → `4px 16px 8px` | 8px |
| `.portrait-frame` | `width:100%` → `width:min(70%, 300px)`、`margin-inline:auto` で中央寄せ | 390px幅では117px |
| `.result-image` | 枠内で `width:100%; height:auto` を維持 | 上行に含む。切抜き・比率変更なし |
| `.result-hero h1` の margin | `16px 14px 0` → `8px 14px 0` | 8px |
| `.catch` の margin | `20px 24px 0` → `12px 24px 0` | 8px |
| `.result-card > .share-actions` の padding-top | 12px → 8px | 4px |

ヒーロー部分で約199px、共有ボタンの開始位置までで約203pxの削減を狙う。絵の幅273pxは指定目安260〜300pxの範囲内。名前とキャッチの左右余白・フォントサイズ・行間は維持し、長いタイプ名の折返しにも余裕を取るため、幅を70%にした。

指示書の v25 QA 値「share-actions 上端約870px」を同じ表示条件へ当てはめると、上端は約671px、主役ボタン上端は約679pxの見込み。ボタンが1行の場合、既存の18px文字・行高1.65・上下padding各17px・上下border各2pxから高さ約67.7px、下端約747pxの計算になる。**この値は同じタイプ・同じ折返しを仮定した見込みであり、全16タイプの下端が844px以内だと実測確認した値ではない。**

追加した規則の全文：

```css
    /* V26: compact only personal-result heroes to bring the share button into view. */
    .result-card:has(> .share-actions) > .result-hero { padding: 8px 0 16px; }
    .result-card:has(> .share-actions) > .result-hero .result-kicker { margin: 4px 16px 8px; }
    .result-card:has(> .share-actions) > .result-hero .portrait-frame { width: min(70%, 300px); margin-inline: auto; }
    .result-card:has(> .share-actions) > .result-hero .result-image { width: 100%; height: auto; }
    .result-card:has(> .share-actions) > .result-hero h1 { margin: 8px 14px 0; }
    .result-card:has(> .share-actions) > .result-hero .catch { margin: 12px 24px 0; }
    .result-card > .share-actions { padding-top: 8px; }
```

## 保護対象と検証結果

| 検査 | 結果と範囲 |
| --- | --- |
| 着手前の基準版 | 最初に指示書を全文読み、その後の SHA-256 が指定 v25 と完全一致。commit 5885674 は指示書の識別情報として扱い、git コマンドによる確認は行っていない。 |
| 追記以外の全文一致 | 保存後から V26 ブロック703バイトだけを取り除いた全文が、保存しておいた v25 の177,964バイトとバイト単位で一致。保存後は178,667バイト。 |
| 全 script の構文 | Node.js v22.17.0。script 全2本を抽出し、それぞれ `node --check` を実行。2本とも終了コード0、標準出力・標準エラーとも空。両 script は v25 と完全一致。 |
| 適用範囲の HTML 構造 | Node VM・最小限の模擬DOMで実際の生成関数を実行し、Python HTMLParser で確認。16タイプの結果すべてに、ヒーローと直下の share-actions を持つカードが1個ずつ存在。図鑑詳細16件＋トップ・図鑑一覧・質問の計19件には対象条件が成立しない。35ケース PASS。CSS エンジンでの描画確認ではない。 |
| 既存ファイルの保護 | 実行環境が追記する `.log` と `.git` を除く既存237ファイルの SHA-256 を前後照合。変更は index.html だけ、新規作成は本報告書だけ、削除なし。検証用ファイルはプロジェクト外の一時ディレクトリに保存。 |
| 実画面・ボタン下端 | 未実施。ローカル HTML のブラウザ表示が拒否され、390×844・320px幅・デスクトップの計測とスクリーンショットは取得できていない。 |
| 操作・実機 | 20問の通し操作、タップ、iPhone、OS共有、画像保存は未実施。模擬DOMによる HTML 生成を実操作として扱っていない。 |

全文一致の照合により、AXES／FAMILIES／TYPES／QUESTIONS、数値・採点・割合計算、全 script、全文章・タグ、detailHTML を含む生成 HTML、shareTextFor／shareIntentHref／SHARE_SITE_URL／SHARE_HASHTAGS／copyResult／generateShareBlob／downloadShareImage、共有引数 `{ files: [file], text: shareTextFor(code) }` が不変であることを確認した。挿絵ファイル・画像パス・HTML 構造も変更していない。

水彩素材、家系色・金・インク色、背景、質感、角の形、書体、文字サイズ、行間、動きの規則は既存値を維持した。世界観の維持はソースで確認した範囲であり、実物を並べた視覚受け入れは未実施。

| 対象 | SHA-256 |
| --- | --- |
| 開始時 index.html（指定 v25 と一致） | `f6e822ab5e3942f9e51c4d4ecff48adc761778eb61f38c5cda99b77f3576cb46` |
| 保存後 index.html（v26） | `8e99b8321cbb89f0f8caa7264d90e5678732a74eb71bbdb3f8a4c19f0824e900` |

保護対象の意図しない変更は起きやすさ1＋影響3＝4として全文照合を実施。共有ボタンの画面外残留は2＋2＝4として実画面確認を試みたが、下記の制限で未検証。

検証資料の一時保存先：`/private/tmp/fairytale-v26-diz0jvzj/`。`index.before.html`、`files.before.json`、`files.after-verification.json`、`change.diff`、`v26.css`、`source-verification.json`、`html-fixtures.json`、`html-verification.json`、`script-1.js`、`script-2.js`、`verify.cjs`、`verify-html.py`。永続成果物は index.html と本報告書であり、一時ディレクトリは削除され得る。

一時資料が残っている場合の再実行：

```sh
node /private/tmp/fairytale-v26-diz0jvzj/verify.cjs
python3 /private/tmp/fairytale-v26-diz0jvzj/verify-html.py
```

## 残件と再開条件

ブラウザ確認が許可される環境で、この SHA-256 の index.html と既存 images を静的配信し、390×844・スクロール0で20問を通して回答する。結果の主役ボタンの `getBoundingClientRect().bottom` が844px以内（目安820px以内）かを確認する。名前やキャッチが長いタイプを含む全16タイプの表示、絵の中央寄せ・比率・見栄え、320px幅、トップ・図鑑・質問の表示維持を確認して視覚品質を判定する。追加依存やビルド工程はない。

着手前に親 AGENTS.md、V26指示、V25_BUILD_REPORT.md、既存の LILY_RESUME.md、関連コードと水彩素材の参照指示を確認した。案件内に HANDOFF は未検出。旧イラスト生成は再開していない。TEAM.md は GitHub コネクタで取得し、冒頭「現行体制（2026-11-24）」と定義を確認した。今回は指定済みの表示サイズと余白の局所修正として実施した。

Reason の本件一覧は自セッションのみ。OS全体のプロセス確認は `ps` が権限制限で実行できず未確認。Studio の指定入口は現行 native skill catalog で未検出・未接続であり、キャッシュにある別経路のファイルを現在の入口として代用していない。

Linear を「fairytale-type16」「童話」で検索したが、対応する既存案件を特定できなかった。返された他案件への書込みや新規台帳の作成はしていない。クロエ側で本報告に対応する既存 Issue の特定・同期が残る。

git 操作・commit・push・公開・アップロード・SNS投稿は行っていない。

実画面確認は自動承認レビューに拒否された。対象は Playwright による `file:///Users/konomichiharu/fairytale-type16/index.html` の表示、理由は `MCP tool call requires approval, but approval policy is never`。追加の承認要求や別経路による同操作の迂回は行っていない。
