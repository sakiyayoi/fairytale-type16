# v28 本番反映 報告（2026-11-26）

内容：共有の形を「結果カードを作って共有する」に変更（本人の指示 2026-11-26 10:07「結果カード作って共有する形にしよ。」）。

## 変更内容
- 結果カード画像を新設（正方形 1080×1080、PNG）。構成＝ロゴ（現行の本ロゴ）／キャラ絵（大きく、タイプ色の枠）／家系名・モチーフ・コード／タイプ名／キャッチコピー／4軸のパーセント表示（家系色の小さなゲージ＋両極の数値）／サイトURL。枠と装飾は家系色、世界観は v17 水彩絵本の既存素材のみで合成。
- 結果画面の主役ボタンを「結果カードでシェアする」に変更（ヒーロー直下・primary のまま）。押すと結果カードを生成し、Web Share {files, text} で共有。text は現行のまま（文章＋結果ページURL r/<コード>.html＋タグ3つ #童話キャラ16タイプ診断 #性格診断 #タイプ診断）。
- Web Share が使えない環境では、生成した結果カードを表示し、保存ボタン＋「Xで投稿する」への誘導を出す（v25 のフォールバックと同じ型）。サブの「Xで投稿する」は不変。
- 結果ページ r/*.html の OGP 画像は現行の横長（1200×630）のまま。既存 generateShareBlob は変更していない。診断ロジック・結果の文章・文面・タグは文字単位で不変。

## 実装経路
- 実装: Mac の CLI の Codex に委譲（CODEX_V28_PROMPT.md → V28_BUILD_REPORT.md）。Mac サンドボックス制限で実描画のみ未検証だったため、検証は VM 側で実施（V28_BUILD_REPORT.md 追補）。

## 検証証跡（VM側）
- 不変照合: v27 との diff は共有まわりだけ。データ区間バイト一致、保護対象関数（generateShareBlob／shareTextFor／shareIntentHref／shareUrlFor／calculateResult）完全一致、script 構文 PASS。
- 実ブラウザQA（hidden_files/v28-qa/qa28.cjs、390×844）PASS: 主役ボタン文言、Web Share 引数（fairytale-CRHF-card.png／1080×1080／text 不変）、フォールバック表示（1080×1080 のカード＋保存ボタン）、JSエラーなし。
- 全16タイプ生成（genall28.cjs）: 全て 1080×1080。card-CRHF.png（実スコア）と card-QRSP.png（最長名）を目視し、キャラ絵・タイプ名・軸・URLが読めることを確認。実物は result-card-sample-CRHF.png。

## 公開
- commit は本文書と同一コミットで main へ push（ハッシュは git log 参照）。
- 公開URLの HTTP 200（トップ＋結果ページ）は push 後に確認し、日次ログへ記録する。
