# V27_BUILD_REPORT

2026-11-25 JST。[CODEX_V27_PROMPT.md](CODEX_V27_PROMPT.md) の全文と基準ハッシュを確認して作業した。

**v27 は未完了。共有URLの変更と生成スクリプトの保存・構文検査は完了したが、結果ページは 0/16、JPEG は 0/16。実ブラウザ生成が実行環境の制限で停止しており、表示・操作も未検証。共有先ファイルがまだ存在しないため、この状態を公開用の完成版として扱わない。**

## 変更ファイル

| ファイル | 変更内容・保存状態 |
| --- | --- |
| [index.html](index.html) | 1216、1218、1220行の共有URL関連だけを変更。下記3置換以外は指定v26とバイト単位で一致。 |
| [tools/build-result-pages.mjs](tools/build-result-pages.mjs) | 新規。実ブラウザから本体のデータ・描画HTML・CSSを取得し、静的結果16ページと任意指定のJPEG16枚を生成するコード。構文検査済み、生成実行は未完了。 |
| [tools/lib/chromium.mjs](tools/lib/chromium.mjs) | 新規。Node標準モジュールのみで、専用一時プロファイルのheadless Chromeを起動し、CDPのpipe経由で操作する補助コード。プロジェクト用HTTP配信は127.0.0.1の一時ポートに限定。構文検査済み。 |
| [V27_BUILD_REPORT.md](V27_BUILD_REPORT.md) | 本報告。 |

`r/*.html` と `images/share/*.jpg` は未生成。代替のダミーページ・画像は作成していない。既存のキャラ絵、ロゴ、プレビュー、依存関係は変更していない。

## 共有URLの変更

```js
function shareUrlFor(code) { return `https://sakiyayoi.github.io/fairytale-type16/r/${code.toLowerCase()}.html`; }
const SHARE_HASHTAGS = '#童話キャラ16タイプ診断 #性格診断 #タイプ診断';
function shareTextFor(code) { return `童話キャラ16タイプ診断で、私は『${TYPES[code].name}』でした。 ${shareUrlFor(code)} ${SHARE_HASHTAGS}`; }
function shareIntentHref(code) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextFor(code))}&url=${encodeURIComponent(shareUrlFor(code))}`;
}
```

変更は次の3箇所のみ。

1. `SHARE_SITE_URL` 定数を `shareUrlFor(code)` に置き換えた。
2. `shareTextFor(code)` 内のURL参照を `shareUrlFor(code)` に置き換えた。
3. `shareIntentHref(code)` の `url` パラメータを `shareUrlFor(code)` に置き換えた。`text` パラメータは変更後の `shareTextFor(code)` を使うため、同じ結果URLを含む。

例：QRSP は `https://sakiyayoi.github.io/fairytale-type16/r/qrsp.html`。共有文の「童話キャラ16タイプ診断で、私は『<name>』でした。」とタグ3つは不変。共有URLに `?v=2` は付けない。トップページの既存OG画像メタデータに含まれる `?v=2` は、共有URL関数の対象外であり、指示どおり変更していない。

## 生成スクリプトの方式

以下は保存したコードの内容であり、生成成功の報告ではない。

- Node標準モジュールのみ。Playwrightや新しい依存パッケージを追加しない。インストール済みChrome/ChromiumをCDPで操作し、`Runtime.evaluate` により実ブラウザの `TYPES`、`FAMILIES`、`AXES`、`PAIR_LINES`、`companionCode(code)`、`pairLine(code)`、`shareUrlFor(code)` を取得する。VM・正規表現によるデータ抽出は使用しない。
- 結果本文は本体の `detailHTML(code, false)` をそのまま使う。persona、title、catch、家系説明、モチーフ、コード、4軸の方向と説明、つよさ、注意点、恋愛、相性、出典を省略しない。個人の回答割合を捏造しない。文章・相性ロジックはスクリプトへ複製しない。
- 生成時に本体の `<style>` 全文、背景のv17水彩素材、ヘッダー、フッターを取得する。追加CSSは0件。既存の `.share-actions` と `.button.primary` を使い、ヒーロー直後と末尾に「自分のタイプを診断する」（`../index.html`）を置く。
- `#type/<CODE>` のリンクは同じ `r/` 内の小文字HTMLファイルへ変換し、相性相手・家系マップから各結果ページへ進める。別途「詳しく見る」（`../index.html#type/<CODE>`）を置く。ローカル画像参照を `../images/...` に直す。
- 家系マップの既存CSSには `href="#type/..."` を条件にする色指定がある。リンク変換前に実ブラウザの `getComputedStyle` で `--map-color` を取得し、その値を各グループに保持する。新しい色や別の配色表は追加しない。
- 静的ページに診断用JavaScriptや動作しないコピーボタンを残さない。出典・説明はHTMLの `details` として残し、JavaScriptなしでも開ける構成にする。
- `<title>`／`og:title`／`twitter:title` は指定文面。descriptionは本体のcatch。`og:url` とcanonicalは自ページの絶対URL、`og:image`／`twitter:image` は `images/share/<code>.jpg` の絶対URL。`og:type=website`、`twitter:card=summary_large_image` を付ける。画像の寸法・形式・altもメタデータへ記載する。
- コード順をソートし、出力改行を固定。日時を生成HTMLへ埋め込まない。同じバイト列の場合はファイルを書き換えない。画像再生成は `--images` に分離した。ただし再実行の一致検証はまだできていない。

### JPEGの生成方式

1. `await document.fonts.ready` を待つ。
2. 本体の `generateShareBlob(code)` を呼ぶ。本体の関数がキャラ絵と `images/v21/logo-book.png` のload完了を待ってPNGを返す。**この関数、`loadShareImage`、描画座標、文字設定は変更していない。**
3. そのPNGを `createImageBitmap` で読み、別canvasを白で全面塗りしてから描く。
4. `toBlob(callback, 'image/jpeg', 0.9)` でJPEG化する。MIME型と1200×630を確認して保存する。
5. 一枚ずつ待って保存し、その後で次のタイプへ進む。全生成後は保存したJPEGをブラウザで再読込みし、全16枚の実寸を確認する。

Nodeによる別の描画実装や新規イラスト生成は採用していない。JPEGは圧縮形式のためPNGと画素単位で同一にはならず、同じ本体描画からの変換になる。OSやブラウザのフォント差による見え方の差は実生成後の確認が必要。

### 再生成コマンド

必要環境は Node.js 22系と、利用可能なChrome/Chromium、ローカルHTTP待受けとブラウザ起動が許可された実行環境。本作業のNodeは `v22.17.0`。MacのChrome実行ファイルは存在を確認したが、今回ブラウザ版番号の実取得はできていない。

プロジェクトのディレクトリで初回生成・画像を含む再生成：

```sh
node tools/build-result-pages.mjs --images
```

初回生成が成功した後、既存のJPEGを保ってHTMLを再生成：

```sh
node tools/build-result-pages.mjs
```

Chromeが標準位置にない場合：

```sh
CHROME_BIN=/absolute/path/to/chromium node tools/build-result-pages.mjs --images
```

通常はMacのChrome標準位置、またはPATH内の `chromium`／`chromium-browser`／`google-chrome`／`google-chrome-stable` を探す。初回に `--images` を省略した場合、JPEG参照検査は既存ファイルが必要なため失敗する。

生成後のコードには、各HTMLをブラウザの `DOMParser` で解析し、全 `src`／`href` とOG画像パスの参照ファイルが存在することを確認する処理も含む。4軸、不要なscript/buttonの不在、画像実寸、ブラウザのJS例外も検査する。この後処理自体は今回未到達。

## 検証結果

| 検査 | 結果 |
| --- | --- |
| 着手前SHA-256 | 指示書のv26基準値と完全一致。commit名は指示書上の識別情報として扱い、gitによる確認は行っていない。 |
| 共有URL以外のバイト一致 | PASS。変更後から上記3置換だけを逆変換した全文が、着手前に保存した178,667バイトと完全一致。変更後は178,712バイト。 |
| データ文字列・採点・描画の不変性 | PASS。上記全文照合により、AXES／FAMILIES／TYPES／QUESTIONS／PAIR_LINES、採点、companionCode、全結果文、generateShareBlob、CSS、トップ・質問・図鑑のコードとマークアップが不変。動作確認の代わりにはしない。 |
| index内script構文 | PASS。Python標準HTMLParserで抽出した全2本に `node --check` を実行。ともに終了コード0、stdout/stderr空。2本目はv26と全文一致。 |
| 新規mjs構文 | PASS。生成スクリプト・Chrome補助コードの2本とも `node --check` が終了コード0、stdout/stderr空。 |
| 既存ファイル保護 | PASS。`.git` と実行ログ `.log` を除く既存239ファイルをSHA-256で照合し、変更はindex.htmlだけ、削除0。新規ファイルは上記のとおり。 |
| 16ページ生成 | **未実施：0/16。** 初回生成はHTTP待受け時点で停止。 |
| 16画像生成・寸法 | **未実施：0/16。** 1200×630はコード上の検査条件のみで、実ファイルの寸法確認はできていない。 |
| 全src/href実在・OGP・冪等性 | **未検証。** 生成ページがないため実物照合に未到達。 |
| 390×844、320px幅、デスクトップの実画面 | **未検証。** スクリーンショット未取得。 |
| CTA・相性・詳しく見る・20問通し操作 | **未検証。** 実ブラウザ表示の拒否により未実施。 |
| iPhone・Tailscale・Xプレビュー | **未検証。** 試作品の配信、公開、SNS投稿は行っていない。 |

| 対象 | SHA-256 |
| --- | --- |
| 着手前index.html（v26） | `8e99b8321cbb89f0f8caa7264d90e5678732a74eb71bbdb3f8a4c19f0824e900` |
| 保存後index.html | `33a155eb56cbcdd122821b43fea0b9b360a495d079a8b3882f786d0fd3b6d2bc` |

本文・採点の意図しない変更は起きやすさ1＋影響3＝4として全文照合を実施。共有先の欠落は3＋3＝6で、現状の完成判定を止める未解消項目。画像・リンク・スマホ表示は2＋2＝4として、実生成後の確認が必要。

検証資料の一時保存先は `/private/tmp/fairytale-v27-7e1u14rz/`。`index.before.html`、`files.before.json`、`source-verification.json`、`change.diff`、`script-1.js`、`script-2.js` を保存した。一時領域は削除され得るため、恒久的なバックアップの完了とは扱わない。

## 停止原因・残件・再開条件

`node tools/build-result-pages.mjs --images` は以下で終了した。Chrome起動や本体データ取得には未到達。

```text
Error: listen EPERM: operation not permitted 127.0.0.1
code: 'EPERM'
syscall: 'listen'
address: '127.0.0.1'
```

HTTP待受けを使わない通常のローカルファイル表示として、Playwright MCPで `file:///Users/konomichiharu/fairytale-type16/index.html` を開く操作も試したが、自動承認レビューに拒否された。

```text
MCP tool call requires approval, but approval policy is never
```

拒否後に別のブラウザツールや直接Chrome起動で迂回していない。現在の承認ポリシーでは追加承認を要求できないため、許可された環境での再開が必要。

次の作業は、ブラウザ起動とローカル配信が許可された環境で上記初回コマンドを実行し、16HTML＋16JPEGを揃えること。その後、出力の再読込み、全パス・メタデータ・1200×630、HTML再生成の一致、スマホ表示を確認する。結果ページの診断CTA→トップ→20問→結果、相性相手ページ、図鑑詳細の実操作を通し、本報告の未検証欄を実結果で更新してからクロエの公開工程へ渡す。

## 着手時の確認範囲

- 本人指示、親AGENTS.md、v27指示全文、v26報告、既存のLILY_RESUME.md、関連コード、v17素材参照指示、媒体加工環境のAGENTS.mdと入口を確認した。旧イラスト生成は再開していない。
- TEAM.mdはGitHubコネクタで読み、冒頭「現行体制（2026-11-24）」を確認した。案件内のHANDOFFは未検出。Reasonの本件一覧では稼働中は自セッションだけで、他の記載はオフラインだった。
- Claude構造レビューはv27指示書に含まれる結論と必須条件を読んだ。`hidden_files/claude_v27_review.txt` の全文はローカルに存在せず、対象リポジトリからの取得も404で未確認。全文を読んだとは扱わない。
- 既存画面の静的出力として、本体の素材・配色・質感・書体・形・動きと本文を再利用した。v27専用の実例リサーチファイルは未検出。実装方式の確認では [Open Graph公式のメタデータ例](https://ogp.me/) と [MDNのtoBlob仕様・JPEG変換例](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) の本文を読んだ。Xの旧Card説明URLはAPI概要へ転送され、当該Card仕様本文の確認とは扱っていない。
- Studio指定入口は現行native skill catalogで未検出・未接続。キャッシュの別経路のファイルを現行入口として代用していない。
- Linearを `fairytale-type16` と `童話` で検索したが対応案件を特定できなかった。別案件へ書き込まず、新規台帳も作っていない。クロエ側で既存Issueを特定し、本報告の状態と同期する作業が残る。

git操作・commit・push・公開・アップロード・SNS投稿は行っていない。

---

## 追補（2026-11-25、クロエ／VM側で生成・検証を完了）

Mac 側 Codex はサンドボックス制限（ローカルHTTP待受け EPERM、ブラウザ表示の自動承認拒否）で生成実行のみ停止した。共有URL変更と生成スクリプトは完成していたため、VM 正本へ取り込み、VM の Chromium（Chrome/159.0.8154.6、CHROME_BIN に --no-sandbox ラッパー指定）で生成を実行した。

- `node tools/build-result-pages.mjs --images` 実行結果: `PASS: 16 pages, 16 JPEGs at 1200x630, 992 references.` 結果ページ16/16、シェア画像16/16 を生成。
- 独立検証（VM）:
  - index.html の v26 との diff は共有URL関連3行のみ（shareUrlFor 新設、shareTextFor、shareIntentHref の url）。診断ロジック・文章・タグは不変。
  - 全16画像: JPEG・1200×630 を PIL で確認。cwhf.jpg を目視し、現行 canvas シェア画像と同一デザイン（ロゴ・キャラ絵・名前・キャッチ・モチーフ・URL）で白背景が黒化していないことを確認。
  - 全16ページ: og:title がタイプ別文面、og:image / og:url が絶対URLでタイプごとに正しいこと、CTA「自分のタイプを診断する」があること、`?v=2` が無いことを機械確認。
  - 実ブラウザQA（hidden_files/v27-qa/qa27.cjs、390×844、20問回答→結果 QWHP）: X intent の text と url、Web Share の text のいずれもデコードして `https://sakiyayoi.github.io/fairytale-type16/r/qwhp.html` が入ることを確認。タグ3つ不変、JSエラーなし。
  - r/cwhf.html を 390px で表示しスクリーンショット目視（shot-v27-r-cwhf-390.png）: 水彩絵本の世界観を維持、キャラ絵・タイプ名・キャッチ・CTAボタンが収まり、横はみ出しなし（scrollWidth=390）。
