# v25 実装指示（童話キャラ16タイプ診断）

対象は **index.html のみ**（完了報告として V25_BUILD_REPORT.md の新規作成は可）。他のファイルは変更しない。
前提：現行 index.html は v24（SHA-256 da23da164432aa7ddc518de7b5fd1220f7e237bc3ff221ac8cb8d37f375ce226）。ここから始めること。

## 本人の決定（2026-11-24 17:47 再決定）
v24 で主役にした「Xで投稿する」（intent）を改め、**結果画像つきシェアを主役に戻す**。「やはり画像付きでできるようにしたい。結果画像付きでね」が本人の言葉。

## 変えてはいけないもの（文字単位で現行維持）
- 診断ロジック・データ（AXES／FAMILIES／TYPES／QUESTIONS 等）・数値・採点・割合計算
- `shareTextFor`、`shareIntentHref`、`SHARE_SITE_URL`、`SHARE_HASHTAGS` の各本文・定数（シェア文面・タグは不変）
- `copyResult`、`generateShareBlob`、`downloadShareImage` の関数本文（呼び出し側の分岐変更は可、関数自体は不変）
- 共有引数 `{ files: [file], text: shareTextFor(code) }` の渡し方（v23 のまま）
- 結果・図鑑・質問等の文章（下記の新規表示文言だけ追加可）
- シェア画像の中身（generateShareBlob の描画内容）

## ① 主役とサブの入れ替え（detailHTML の .share-actions、personal のみ・現行位置のまま）
現行の共有ブロック（result-hero 直後）の中身の順序と役割を入れ替える：
1. **主役** `<button class="button primary" data-action="share" data-code="${code}">結果画像つきでシェアする <span aria-hidden="true">↗</span></button>`（primary の大きさ・見た目。ラベルは正確に「結果画像つきでシェアする」）
2. **サブ** `<a class="button share-sub" href="${intentHref}" target="_blank" rel="noopener">Xで投稿する <span aria-hidden="true">↗</span></a>`（小さめ・下。既存の `.share-actions > .share-sub` 規則がそのまま効く想定だが、効かない場合は V25 CSS ブロックで同等の見た目を足す）
3. `<p id="share-status" class="status" role="status" aria-live="polite"></p>`（現行どおり1個）
4. `<div class="share-fallback" id="share-fallback" hidden>…</div>` の中身は次の順にする：
   - `<img class="share-fallback-image" id="share-fallback-image" alt="診断結果のシェア画像" hidden>`（②で生成画像を表示するための受け皿。初期は src なし・hidden）
   - 「画像を保存する」ボタン（`data-action="share-download"`、現行どおり）
- id の重複禁止。末尾 `.actions` には共有一式を戻さない。

## ② Web Share が使えない環境で、主役を押した時に無言で終わらせない
`shareResult` の変更（外側 try/catch・AbortError の扱い・finally の button.disabled 復帰は現行構造を維持）：
- 現行の showFallback を、生成済み blob を受け取って次を行う形に変える（例：`showFallback(blob)`）：
  - fallback を表示する（hidden を外す）。
  - blob から Object URL を作り、`#share-fallback-image` の src に設定して表示する（hidden を外す）。前に作った Object URL があれば revoke してから差し替える。
  - status に次の案内を表示する（X ボタンへの誘導＋保存方法の案内）：
    「この環境では画像つき共有が使えません。結果画像を表示しました。画像を保存して、『Xで投稿する』から投稿に添付できます。」
- showFallback を呼ぶ既存の経路（navigator.share 自体が無い／text のみ共有が AbortError 以外で失敗／外側 catch の非 AbortError）は、すべて生成済み blob を渡して画像表示つきにする。
- 画像生成（generateShareBlob）自体が失敗した場合は現行どおり共有を試みず、status に「画像を作れませんでした。文章だけでも投稿できます。『Xで投稿する』をお使いください。」を表示して return（画像が無いので fallback の画像表示はしない）。
- files 共有成功／text のみ共有成功／AbortError でステータスを空にする分岐は現行のまま。

## CSS
- `<style>` 末尾に V25 ブロックを**追加**するだけ（既存規則は書き換えない）。
- `.share-fallback-image`：幅は fallback 内に収まる 100%、height auto、display block、世界観（金・明朝）に合う控えめな枠。
- 主役ボタン（button.primary）が既存 `.share-actions > .button.primary` で primary の見た目になることは確認し、ならない場合だけ V25 ブロックで補う。

## 完了条件
- 変更は index.html の detailHTML（共有ブロックの主従入れ替え＋fallback 内 img 追加）／shareResult（showFallback の画像表示化＋案内文）／CSS 末尾 V25 ブロック追加だけ。
- 全 script に node --check 相当の構文検査を行い、結果を報告に書く。
- V25_BUILD_REPORT.md を作り、変更箇所（行単位の要約）、触っていないこと（診断ロジック・データ・shareTextFor・shareIntentHref・copyResult・generateShareBlob・downloadShareImage・共有引数）、検証結果を明記する。
- git 操作・push・公開・SNS投稿はしない。
