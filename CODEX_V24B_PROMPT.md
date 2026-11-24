# v24（仕様変更版）実装指示（童話キャラ16タイプ診断）

対象は **index.html のみ**（完了報告として V24_BUILD_REPORT.md の新規作成は可）。他のファイルは変更しない。
前提：現行 index.html は v23（SHA-256 a3dfd79493c0215c719107e94c114a4708a9118bac702fc5debf3d2cf039f203）。ここから始めること。
旧 CODEX_V24_PROMPT.md は本人の仕様変更で停止済み。**この V24B が正**。旧指示の「画像つきシェアが primary」は採用しない。

## 本人の決定（2026-11-24）
「初めから、Xで投稿！にしよ！」共有シート経由は環境で失敗が相次ぐため、確実に文章が入る X intent を最初から主役にする。ユーザーの手間を増やさない（貼り付け等の追加操作は禁止）。

## 変えてはいけないもの（文字単位で現行維持）
- 診断ロジック・データ（AXES／FAMILIES／TYPES／QUESTIONS 等）・数値・採点・割合計算
- `shareTextFor`、`shareIntentHref`、`SHARE_SITE_URL`、`SHARE_HASHTAGS` の各本文・定数
- `copyResult`、`generateShareBlob`、`downloadShareImage` の関数本文（呼び出し側の分岐変更は可、関数自体は不変）
- 結果・図鑑・質問等の文章（下記の新規表示文言だけ追加可）
- シェア画像の中身

## ① 結果画面のボタン構成変更（personal の結果画面のみ）
現行：シェアボタン一式は detailHTML 末尾の `.actions`（全セクションの下）にある。
変更：
- detailHTML の `<header class="result-hero">…</header>` の**直後**（result-card 内、persona セクションの前）に、新しい共有ブロック `.share-actions` を置く。personal の時だけ出す（現行どおり）。結果表示直後にスクロールなしで目に入る位置にする。
- 共有ブロックの中身（この順）：
  1. **主役** `<a class="button primary" href="${intentHref}" target="_blank" rel="noopener">Xで投稿する <span aria-hidden="true">↗</span></a>`（常時表示・primary の見た目。世界観 v17 水彩絵本に合わせる。ラベルは正確に「Xで投稿する」）
  2. **サブ** `<button class="button share-sub" data-action="share" data-code="...">結果を画像つきでシェアする <span aria-hidden="true">↗</span></button>`（現行ラベル維持。primary にはしない。小さめにする CSS を V24 ブロックで追加）
  3. `<p id="share-status" class="status" role="status" aria-live="polite"></p>`
  4. `<div class="share-fallback" id="share-fallback" hidden>…</div>` の中は「画像を保存する」ボタン（data-action="share-download"）**だけ**にする（Xボタンの重複禁止。主役が常時表示のため）
- 末尾 `.actions` からは、上記一式（share ボタン／share-status／share-fallback／旧 fallback 内の X リンク）を**削除**する。copy ボタン等は現行どおり残す。同じボタン・同じ id を2つ作らないこと。
- 共有シートが使えない環境でも主役 X ボタンは常時使えるため、初期表示で特別な案内は必須としない。ただし share ボタン押下時の失敗は ② で必ず案内する。

## ② 共有失敗時に無言で終わらない
`shareResult` の変更（外側 try/catch・AbortError の扱い・finally の button.disabled 復帰は現行構造を維持）：
- 画像生成（generateShareBlob）が失敗した場合：共有を試みず、status に次を表示する（fallback 表示は任意だが、X への誘導文は必須）：
  「画像を作れませんでした。文章だけでも投稿できます。『Xで投稿する』をお使いください。」
  実装は generateShareBlob の呼び出しを内側 try/catch で包み、失敗時に上記を出して return する形とする（finally で disabled が戻る構造は崩さない）。
- showFallback の文言を次に変える：
  「この環境では画像つき共有が使えないため、画像の保存ボタンを出しました。文章だけなら『Xで投稿する』をお使いください。」
- それ以外の分岐（files 成功／text のみ共有／AbortError でステータスを空にする）は現行 v23 のまま。

## CSS
- `<style>` 末尾に V24 ブロックを**追加**するだけ（既存規則は書き換えない）。
- `.share-actions`：result-card 内でヒーロー直下に収まり、幅は既存 .actions のボタンと同等、gap 12px 程度、世界観 v17 水彩絵本（明朝・金・深いインク）を維持。
- サブボタン用 `.share-sub`：主役より小さめ（font-size / padding を控えめに）。主役と並列に大きく見せない。

## 完了条件
- 変更は index.html の detailHTML（共有ブロック新設・末尾からの削除）／shareResult（画像失敗分岐・showFallback 文言）／CSS 末尾 V24 ブロック追加だけ。
- 全 script に node --check 相当の構文検査を行い、結果を報告に書く。
- V24_BUILD_REPORT.md を作り、変更箇所（行単位の要約）、触っていないこと（診断ロジック・データ・shareTextFor・shareIntentHref・copyResult・generateShareBlob・downloadShareImage）、検証結果を明記する。
- git 操作・push・公開・SNS投稿はしない。
