# V25_BUILD_REPORT

2026-11-24 JST。[CODEX_V25_PROMPT.md](CODEX_V25_PROMPT.md) に従い、[index.html](index.html) を更新した。

**実装保存、全 script の構文検査、保護対象のソース照合、共有分岐の模擬試験は完了。実画面・スマホ幅・iPhone の共有／保存は未検証。** 本報告はクロエ向けの実装結果であり、視覚品質の合格、本人採用、公開完了を意味しない。

## 変更箇所

行番号は保存後の index.html。

| 行 | 変更内容 |
| --- | --- |
| 689–694 | style 末尾へ V25 ブロックだけを追加。画像を display:block、width:100%、height:auto、既存の金（--v24-gold / #b08d3f）の1px枠・角丸3pxで表示する。fallback と画像に min-width:0 を指定し、Grid の最小幅による画像のはみ出しを抑える。既存 CSS は変更なし。 |
| 1137 | personal の share-actions 内を「結果画像つきでシェアする」の primary ボタン → 「Xで投稿する」の share-sub リンク → share-status → share-fallback の順に変更。fallback 内は、初期 src なし・hidden の share-fallback-image → 既存の画像保存ボタンの順。result-hero 直後の位置、図鑑、末尾 actions は維持。 |
| 1294–1306 | shareResult 内の showFallback(blob) が fallback と生成画像を表示するよう変更。前の画像 src の Object URL を revoke してから、新しい blob の Object URL を設定。案内文は指定どおり。 |
| 1309、1328–1334 | blob を外側 catch からも参照できる位置で宣言。既存の fallback 呼出し3箇所すべてへ生成済み blob を渡す。 |

primary と share-sub の両方が既存の `.share-actions > .button.primary`／`.share-actions > .share-sub` に一致することを生成 HTML と CSS ソースで確認。primary は18px・金2px枠・深いインク色、サブは15px・最小高48px、明朝の指定を継承する。主役／サブへの追加の上書きは不要と判断した。実ブラウザの computed style や見た目を確認したという意味ではない。

fallback の案内文：

> この環境では画像つき共有が使えません。結果画像を表示しました。画像を保存して、『Xで投稿する』から投稿に添付できます。

画像生成に失敗した場合の既存案内文と return は保持：

> 画像を作れませんでした。文章だけでも投稿できます。『Xで投稿する』をお使いください。

画像生成失敗時は共有 API と画像表示を呼ばない。files 共有／text のみ共有の成功処理、AbortError 時の空ステータス、外側 try/catch、finally の接続中ボタンの disabled 復帰は維持した。

## 保護対象と保存照合

- AXES／FAMILIES／TYPES／QUESTIONS、数値・採点・割合計算を含む診断ロジックとデータは不変。
- shareTextFor、shareIntentHref、SHARE_SITE_URL、SHARE_HASHTAGS は文字単位で不変。
- copyResult、generateShareBlob、downloadShareImage の関数本文は文字単位で不変。シェア画像の描画内容と素材は変更していない。
- files 共有の引数 `navigator.share({ files: [file], text: shareTextFor(code) })` と text のみ共有の引数を維持。模擬試験でもキー・文章・ファイル名・MIME type を照合した。
- detailHTML の共有ブロック以外の本文は文字単位で不変。全16タイプで結果・図鑑 HTML を比較し、共有ブロック以外の生成内容、シェア文面、intent URL の一致を確認した。
- V25 CSS ブロックを除き、detailHTML と shareResult を変更前に戻した全文が、指定 v24 とバイト単位で一致。許可された3箇所以外の変更はない。
- 既存235ファイル（実行環境が追記する .log を除く）の SHA-256 を前後照合。変更は index.html、新規ファイルは本報告書だけ、削除なし。検証コードと一時資料はプロジェクト外の `/private/tmp/fairytale-v25-r2cwr9ib/` に保存した。

| 対象 | SHA-256 |
| --- | --- |
| 開始時 index.html（指定 v24 と一致） | `da23da164432aa7ddc518de7b5fd1220f7e237bc3ff221ac8cb8d37f375ce226` |
| 保存後 index.html | `f6e822ab5e3942f9e51c4d4ecff48adc761778eb61f38c5cda99b77f3576cb46` |

## 検証結果

| 検査 | 結果・範囲 |
| --- | --- |
| 全 script の構文検査 | Node.js v22.17.0。全2本を抽出して各々 node --check。2本とも終了コード0、標準エラーなし。最後の CSS 調整後も、両 script が検査済み内容と完全一致することを確認。 |
| 生成 HTML | Node VM と Python HTMLParser で16タイプ×personal／非 personalの32ケース PASS。共有ブロックの位置・順序・正確なラベル、Xリンクの target／rel、status／fallback／image の id 重複なし、画像の初期 src なし・hidden、画像→保存ボタンの順、末尾 actions に共有一式なし、図鑑に共有ブロックなしを確認。 |
| 共有処理 | Node VM・模擬 DOM／Web Share API で21ケース PASS。files と text の成功・取消・失敗、API不在、canShare 例外、File 構築失敗、画像生成失敗、画面離脱、fallback の再表示を確認。画像 URL 作成へ生成済みの同一 blob が渡ること、再表示時に旧 URL を revoke してから新 URL を作ることも確認。 |
| CSS ソース | 既存規則は完全一致。追加は V25 ブロックだけ。hidden は既存の `[hidden] { display:none !important; }` で維持される。主役／サブに既存セレクタが一致することを確認。幅や外観の実測は未実施。 |
| 実画面・スマホ幅・全20問の通し操作 | 未実施。Playwright のローカルHTML表示が自動承認レビューに拒否された。ソース／模擬DOMの検査を実操作として扱っていない。 |
| 実画像表示・OS共有・画像保存・Xへの遷移・iPhone | 未実施。generateShareBlob は模擬試験では差し替えているため、実PNGの生成・表示を確認したという意味ではない。外部投稿は行っていない。 |

共有失敗時の画像表示不良は起きやすさ2＋影響2＝4、保護対象の意図しない変更は1＋3＝4として、分岐試験と完全一致照合を実施。スマホでの画像幅・主従表示は2＋2＝4として実画面確認を試みたが未検証。

一時資料：`index.before.html`、`files.before.json`、`change.diff`、`source-verification.json`、`behavior-verification.json`、`html-verification.json`、`html-fixtures.json`、`verify.cjs`、`verify-html.py`、`script-1.js`、`script-2.js`。一時ディレクトリは永続成果物ではない。

一時資料が残っている場合の再実行：

```sh
node /private/tmp/fairytale-v25-r2cwr9ib/verify.cjs
python3 /private/tmp/fairytale-v25-r2cwr9ib/verify-html.py
node --check /private/tmp/fairytale-v25-r2cwr9ib/script-1.js
node --check /private/tmp/fairytale-v25-r2cwr9ib/script-2.js
```

アプリは既存の静的 HTML。追加依存・ビルド工程はない。確認時は既存のローカル静的配信環境でこの index.html と images を開き、20問回答後の結果画面から共有経路を操作する。

## 残件と引き継ぎ

ブラウザ確認が許可された環境で、この SHA-256 の保存版をスマホ幅（390px／320px）で開き、20問を通して回答し、主役・サブの大小、画像の幅、失敗時の画像と案内、再度押した時の画像差し替え、画像保存、iPhone の共有を確認する。試遊版の品質合格・公開判定はこの確認後。今回、公開・アップロード・SNS投稿は行っていない。

着手前に親 AGENTS.md、V25指示、V24_BUILD_REPORT.md、LILY_RESUME.md、関連コードを確認。案件内に HANDOFF は未検出。旧イラスト生成は再開していない。TEAM.md は GitHub コネクタで1–180行を読み、冒頭「現行体制（2026-11-24）」と blob SHA `9e42f2b272313ec36f093e171ca03f34b95b9ec8` を確認。今回の作業は、指定済みの共有 UI と失敗処理の局所修正として実施した。

Reason の本件一覧は自セッションのみだった。これは Reason に登録された担当の確認範囲であり、全OSプロセスを確認したという意味ではない。Studio の指定入口は現行 native skill catalog に未検出で未接続。別版の入口は代用していない。

Linear は「童話」「fairytale-type16」で検索したが対応する既存案件を特定できず、同期先未特定。無関係な Issue や新しい台帳には書き込んでいない。クロエ側で対応 Issue への本報告の同期が残る。

手順上の逸脱：指示書の読取りと並行した初期確認で `git status --short` を1回実行してしまった。`fatal: not a git repository`、終了コード128で終了し、状態取得もできていない。その後は git コマンドを実行しておらず、commit・push・リポジトリ変更も行っていない。「git 操作なし」とは報告しない。

実画面確認は自動承認レビューに拒否された。対象は Playwright によるローカル index.html の表示、理由は `MCP tool call requires approval, but approval policy is never`。追加の承認要求や別経路での同操作の迂回は行っていない。
