# V28_BUILD_REPORT

2026-11-26 JST。[CODEX_V28_PROMPT.md](CODEX_V28_PROMPT.md) の全文を読み、指定されたv27の `index.html` SHA-256との一致を確認して実装した。

**結果カードのコード実装と構文・変更範囲・隔離テストは完了。実ブラウザでのPNG生成、見た目、スマホ操作、実共有・実保存は未検証。表示品質まで合格した版とは扱わない。** gitコマンド、commit、push、公開、アップロード、SNS投稿は行っていない。

## 変更ファイル

| ファイル | 内容 |
| --- | --- |
| [index.html](index.html) | 1145行の主役ボタンと画像alt、1302行からの新規 `generateResultCardBlob(code)`、1377行からの共有処理、1422行からの保存処理の指定部分のみ。 |
| [qa/v28-share-check.cjs](qa/v28-share-check.cjs) | 今回の共有変更を検査するNodeテスト。DOM・canvas・画像ロード・Web Shareをテスト用代替にし、外部送信せず割合・非同期・共有・保存・失敗復帰を検査する。実画像は生成しない。 |
| [V28_BUILD_REPORT.md](V28_BUILD_REPORT.md) | 本報告。 |

既存ファイル243件（`.git`と実行ログ `.log` を除く）のSHA-256を作業前に保存し、変更後と照合した。既存ファイルの変更は `index.html` だけ。キャラ絵、ロゴ、既存報告、CSS、`tools/build-result-pages.mjs`、`tools/lib/chromium.mjs` は変更していない。

## 結果カードの実装値

固定値はv28指示書から採用。既存のキャラ絵・ロゴを `loadShareImage` で読み、両方のロード完了を待って合成する。キャラをコードで描いたり、新しい素材を生成したりしていない。

座標の原点は左上。文字のyはalphabeticベースライン。

| 要素 | 実装値 |
| --- | --- |
| 出力 | canvas 1080×1080、`toBlob(..., 'image/png')`、白背景 `#ffffff`。 |
| 家系色 | `FAMILIES[code.slice(0, 2)].color`。最上部の帯、二重枠、ゲージ充填に使用。 |
| 上部帯 | `(0, 0, 1080, 14)`。 |
| 太枠 | `(18, 18, 1044, 1044)`、4px。 |
| 細枠 | `(28, 28, 1024, 1024)`、1px。 |
| ロゴ | `images/v21/logo-book.png`、`(375, 38, 330, 110)`、中央。 |
| キャラ絵 | `images/<CODE>.png`、`(350, 190, 380, 380)`、中央。周囲にタイプ色3pxの枠。 |
| 家系チップ行 | `「<家系名>の家系 ・ <emoji> <motif>（<CODE>）」`、中央x=540、y=610、24px、最大幅900。 |
| タイプ名 | 中央x=540、y=680、700 56px明朝、1回の `fillText` に最大幅900を指定して1行に収める。実フォントでの自然幅と見え方は未検証。 |
| 区切り線 | `(480, 706, 120, 6)`、タイプ色。 |
| キャッチ | 29px、`wrapShareLines(ctx, type.catch, 880)`、最大3行。中央x=540、y=754／791／828、行送り37。3行超過時は既存方式で最終行を詰めて「…」。描画にも最大幅880を指定。 |
| 本文色 | 家系チップ、タイプ名、キャッチ、軸名、両極の数値は `#302b49`。 |
| 4軸 | 行のベースラインy=870／908／946／984。軸名は22px、左x=100。 |
| ゲージ | 各行x=290、y=行ベースライン−14、幅430、高さ12。軌道 `#eeeeee`、充填は家系色、充填幅 `430 * percent0 / 100`。 |
| 数値 | 24px、左x=750、各行と同じベースライン。`<第1極> <percent0>% / <第2極> <100-percent0>%`。両極を同じ本文色で表示。 |
| サイトURL | 中央x=540、y=1030、700 25px、タイプ色。文字列は `sakiyayoi.github.io/fairytale-type16/`。 |

書体スタックは既存 `generateShareBlob` と同じ。

```text
本文: "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif
明朝: "Hiragino Mincho ProN", "Hiragino Mincho Pro", "YuMincho", "Yu Mincho", serif
```

割合は `result?.code === code` の場合だけ `result.scores[index]` を使い、`Math.round(100 * scores[0] / (scores[0] + scores[1]))` とした。result不在・コード不一致なら `axesHTML` の非個人時と同じ `[10, 0]`／`[0, 10]` を使う。新しい採点は追加していない。画像ロード中の画面移動等で別結果の得点が混ざらないよう、割合はロード待機前に確定する。

新関数内に `document.fonts.ready` 待機は追加していない。指示どおり呼び出し側の扱いを変更していないが、現行 `index.html` の `shareResult`／`downloadShareImage` 自体には明示的なfont待機がない。`@font-face`／Google Fonts参照もなく、既存のシステムフォントスタックを使う。実ブラウザ検証では呼び出し前に `await document.fonts.ready` を行うこと。

## 共有・保存

- 主役はヒーロー直下の `button.primary` のまま、文言を「結果カードでシェアする」に変更した。サブの「Xで投稿する」、並び順、CSS、リンク生成は不変。
- `shareResult` と `downloadShareImage` は `generateResultCardBlob` を使う。ファイル名は両方とも `fairytale-${code}-card.png`、共有ファイルのMIMEは `image/png`。
- ファイル共有の引数は `{ files: [file], text: shareTextFor(code) }` のまま。共有文、結果ページURL、タグ3つは不変。
- v25の分岐を維持した。ファイル共有不可でもテキスト共有が成功する環境では従来どおりテキストだけを共有する。Web Share自体が無い場合、テキスト共有の非AbortError失敗、外側の非AbortErrorでは生成したカードを表示する。キャンセル時はステータスを空にし、ボタンを復帰させる。
- フォールバックaltは「診断結果の結果カード」。ステータスは「この環境ではカードつき共有が使えません。結果カードを表示しました。画像を保存して、『Xで投稿する』から投稿に添付できます。」。保存ボタンとXへの導線を維持した。
- 保存完了ステータス「画像を保存しました。Xの投稿に添付してください。」は不変。画像生成失敗時の文言、Object URLの解放、離脱後の共有抑止も維持した。

## v27との差分・不変性の照合

gitを使わず、作業前コピーとのバイト比較とPython `difflib.unified_diff` を使用した。

1. 作業前の全文178,712バイトを保存し、指示書のSHA-256と一致することを確認。
2. 変更後から新規 `generateResultCardBlob` だけを取り除き、以下の置換だけを逆変換した。
   - 主役ボタン文言1件。
   - フォールバックalt1件。
   - フォールバックステータス冒頭1件。
   - `await generateResultCardBlob(code)` → `await generateShareBlob(code)` の2件。
   - `fairytale-${code}-card.png` → `fairytale-${code}.png` の2件。
3. 逆変換した全文が、作業前の178,712バイトと**完全一致**した。
4. unified diffも読み、差分が上記の共有まわりだけであることを確認した。

したがって、AXES／FAMILIES／TYPES／QUESTIONS／PAIR_LINES等の文字列、診断ロジック、採点、結果文章、既存の割合計算、コピー文、タグ、CSS、トップ・質問・図鑑、2本目のscriptはバイト単位で不変。

保護対象4関数も個別に抜き出して比較し、すべて一致した。下表の関数バイト数は先頭のインデント4文字を含み、終端改行を含まない。

| 関数 | バイト数 | SHA-256（前後共通） |
| --- | ---: | --- |
| `generateShareBlob` | 2750 | `4a664a32af4eae7f288f4576599e6121550cb764c1cbde912b53562092162ce4` |
| `shareTextFor` | 166 | `e5311cbe587ed96eee5dc8ae1f490ba36ccf9fb890164e1021d52b626357c53c` |
| `shareIntentHref` | 183 | `360307de7f2968532728b8da925c210decd6a01e4a7617d210a4b4b4cc4070a3` |
| `shareUrlFor` | 118 | `2488e8391817ea0bfc3aa26d0701a3bfb77f5cf100cb4966ce4e28b7b118dc1f` |

| 対象 | SHA-256 |
| --- | --- |
| 作業前index.html（指示書のv27） | `33a155eb56cbcdd122821b43fea0b9b360a495d079a8b3882f786d0fd3b6d2bc` |
| 保存後index.html（v28） | `764eb28b4412c4fbcf03db0d0397cbfc8f318995e494a58cf4571ef45df8887f` |

保存後は182,262バイト。commit識別子 `8bbf070` は指示書の情報であり、gitによる独立確認は行っていない。

## 検証結果

| 検査 | 結果 |
| --- | --- |
| 全script構文 | PASS。Python標準HTMLParserで2本を抽出し、Node v22.17.0の `node --check` で両方終了コード0、stdout/stderr空。 |
| 許可差分だけを逆変換した全文比較 | PASS。v27全文と完全一致。上記保護対象4関数も個別一致。 |
| 既存ファイル保護 | PASS。243件のうち変更はindex.htmlのみ、削除0。 |
| 素材存在・PNGヘッダー | PASS。キャラ16枚は1024×1024、ロゴは2736×912。PNG signatureとIHDRを実ファイルから読んだ。これはデコード・目視の確認とは別。 |
| 16タイプの方向フォールバック | PASS。各タイプでresult不在／コード不一致の計32ケース。 |
| 個人得点の割合 | PASS。16タイプ×3組、計48ケース。50/50、1:2、2:1、0/100、100/0等を含み、丸め、両極の和100、充填幅を検査。 |
| 非同期・長文・生成失敗 | PASS。両素材のロード待機、待機中のresult変更、3行超の省略、画像失敗、canvas取得失敗、blob生成失敗。文字幅はテスト用代替であり、実フォントの検査ではない。 |
| 共有・保存の制御 | PASS。ファイル共有の引数・名前・MIME、テキスト共有維持、非対応時カード表示、キャンセル／他エラー、再表示時URL解放、保存用anchor、1秒後のURL解放、ボタン復帰、離脱後抑止。Web Shareもダウンロードも代替オブジェクトによる検査。 |
| 結果カードPNGの実生成・再読込み | **未検証。実PNG 0枚。** canvas寸法1080×1080とPNG指定はコードおよび代替canvasで確認したのみ。 |
| 長い名前・キャッチ・全16タイプの実画面 | **未検証。** 900px指定での実際の文字幅・縮小具合、文字欠け、重なり、トークンと実物の比較は未実施。 |
| 390×844／320px幅・20問通し操作 | **未検証。** スクリーンショット、入力の通しリハーサルは未実施。 |
| iPhone共有シート・実ファイル保存・Tailscale | **未検証。** 公開・SNS投稿も行っていない。 |

隔離テストは次のコマンドで再実行できる。Node.js 22系を使用し、依存追加・ブラウザ・ネットワークは不要。

```sh
node qa/v28-share-check.cjs
```

今回の出力は `passed: 14`、終了コード0。テストは製品のscriptを読み込んで動かすが、DOM・canvas・画像ロード・Web Shareを代替する。出力中のBlobは明示的なダミーで、保存・提出する結果カードではない。検証のための得点と長文は隔離VM内だけに入れ、製品データへ書き戻していない。

変更前コピー・差分・構文検査用script・照合JSONの一時保存先は `/private/tmp/fairytale-v28-2iswrvdi/`。`index.before.html`、`files.before.json`、`change.diff`、`script-1.js`、`script-2.js`、`source-verification.json` を保存した。一時領域は恒久バックアップとは扱わない。

## 未検証の原因と次の一手

実画面確認のため、Playwright MCPでローカル `index.html` の表示を要求したが、自動承認レビューに拒否された。

```text
MCP tool call requires approval, but approval policy is never
```

拒否された操作は `file:///Users/konomichiharu/fairytale-type16/index.html` のブラウザ表示。理由は、この操作には承認が必要だが現行ポリシーでは承認を得られないため。別ツールや直接ブラウザ起動で迂回していない。

再開条件は、このローカル版をブラウザで表示・操作できる許可済み環境。次の確認をクロエの検証工程で行う。

1. `await document.fonts.ready` 後に16タイプの `generateResultCardBlob` を一枚ずつ実生成・保存・再読込みし、PNG形式と1080×1080、名前・キャッチ・軸・URLの収まり、既存素材・指定配色を確認する。
2. 390×844と320px幅でトップ→20問→個人結果→主役共有→非対応時のカード表示→画像保存まで通す。画面の実割合とカードの4軸を照合し、保存したファイル名・内容も確認する。
3. iPhone等の対応環境で、共有シートへカードPNGと不変の共有文が渡ること、キャンセル後の再操作を確認する。SNS投稿は今回の許可範囲に含まれない。

本文・採点への意図しない変更は起きやすさ1＋影響3＝4として全文比較、共有時の得点違い・保存失敗は2＋2＝4として隔離テストを実施した。文字切れ・スマホ表示は2＋2＝4で実画面確認が残る。

**既存の残件：このMacコピーには `r/*.html` が0件、`images/share/*.jpg` が0件。** 作業前後とも同じで、v27報告にも未生成と記載されている。VMや公開先の現状は未確認。今回の範囲はカード生成変更のため、OGP生成スクリプトの実行・結果ページ追加・横長画像生成は行っていない。公開前にはクロエ側でv27出力の存在を確認する必要がある。

## 着手時の確認範囲

- 最新依頼、親AGENTS.md、v28指示全文、v27報告、v25の共有分岐指示、既存 `LILY_RESUME.md`、関連ソースを確認。案件内にHANDOFFは未検出。旧イラスト生成を再開していない。
- sakiya-kbのTEAM.mdをGitHubコネクタで読み、冒頭「現行体制（2026-11-24）」を確認した。これは規約の読み取りであり、git操作やリポジトリへの書き込みは行っていない。
- Reasonの現行一覧では、本案件の実行セッションは自セッションのみ。他の個人エージェント表示を本案件の稼働とみなしていない。
- 既存共有画像の形と既存共有フローの限定変更として、v28指定の素材・色の役割・枠・書体・座標を実装した。新しい診断・画面構成は設計していない。v28専用のClaude構造検証・実例リサーチ成果物は指示書とローカル資料からは確認できていない。
- 媒体加工環境の入口 `/Users/konomichiharu/.local/bin/codex-creative` とそのAGENTS.mdを確認。今回は既存素材をブラウザcanvasで合成するコードの変更で、元画像の加工・再生成はしていない。
- Studio指定のstable name3入口は現行native skill catalogに未検出・未接続。キャッシュの別版を現行入口として代用していない。
- Linearを `fairytale-type16`／`童話`／`タイプ診断` で検索したが、対応Issueを特定できなかった。別案件への書き込みや新規台帳作成は行っていない。本報告の実装済み・実画面未検証という状態を既存Issueへ同期する作業は、クロエ側のIssue特定後に残る。

---

## 追補（2026-11-26、クロエ／VM側で検証を完了）

Mac 側 Codex はブラウザ表示の自動承認拒否で実描画のみ未検証だったため、VM 正本へ取り込み、VM の Chromium（Playwright chromium-1255）で検証した（hidden_files/v28-qa/qa28.cjs、genall28.cjs）。

- 不変照合（VM）: v27 との diff は共有まわりだけ（主役ボタン文言＋alt、新関数 generateResultCardBlob、shareResult/downloadShareImage の呼び先・ファイル名・フォールバック文）。データ区間（AXES〜flipAxis 手前）はバイト単位で一致し、generateShareBlob／shareTextFor／shareIntentHref／shareUrlFor／calculateResult は完全一致。index 内 script 2本とも node --check PASS。
- 実ブラウザQA（390×844、20問回答→結果 CRHF 白雪姫）PASS:
  - 主役ボタン文言「結果カードでシェアする」を確認。サブ「Xで投稿する」の intent は text・url とも結果ページURL（r/crhf.html）入り、タグ3つ不変。
  - Web Share 引数を捕捉: files=[fairytale-CRHF-card.png, image/png]、text は現行 shareTextFor と完全一致。カード実寸 1080×1080。
  - フォールバック（navigator.share 無効化）: 結果カード（natural 1080×1080）が表示され、status「結果カードを表示しました…」、保存ボタンあり。JSエラーなし。
- 全16タイプのカード生成（方向フォールバック）: 全て 1080×1080 で生成成功。
- 目視: card-CRHF.png（実スコア 14/86・57/43・14/86・0/100）と card-QRSP.png（最長タイプ名）を確認。キャラ絵・タイプ名・キャッチ・家系色の枠とゲージ・両極パーセント・ロゴ・サイトURLが読め、はみ出しなし。
