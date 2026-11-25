# v27 本番反映 報告（2026-11-25）

内容：共有URLを「その答え専用のURL」に変更（本人の指示 2026-11-25 11:30「その答えのURLにしたい。共有するの。」）。

## 変更内容
- 共有URLをトップ（?v=2付き）から結果ページ `https://sakiyayoi.github.io/fairytale-type16/r/<コード小文字>.html` へ差し替え。Web Share の text と X intent の text・url の両方。文面とタグ3つ（#童話キャラ16タイプ診断 #性格診断 #タイプ診断）は不変。index.html の変更は共有URL関連3行のみ。
- 静的結果ページ16件を新規生成（r/<コード小文字>.html）。本体 detailHTML を実ブラウザで再利用し、キャラ絵・タイプ名・キャッチ・persona・4診断軸・つよさ・注意点・恋愛・相性・出典を掲載。目立つ「自分のタイプを診断する」ボタン付き。各ページ専用OGP（og:title はタイプ別、og:image は専用シェア画像、絶対URL、canonical付き）。
- 静的シェア画像16枚を新規生成（images/share/<コード小文字>.jpg、1200×630）。既存 generateShareBlob の PNG を白塗り canvas 経由で JPEG 化し、デザインは二重管理していない。
- 再生成スクリプト tools/build-result-pages.mjs（+ tools/lib/chromium.mjs）を追加。文章が変わったら `node tools/build-result-pages.mjs --images` で流し直せる。

## 実装経路
- 設計: Mac の Claude（claude -p --model opus）で構造レビューを受け「致命的問題なし」。必須条件（JPG白塗り経由、fonts.ready 待ち、OGP絶対URL、shareUrlFor 単一関数化、参照実在検査）を反映（hidden_files/claude_v27_review.txt）。
- 実装: Mac の CLI の Codex に委譲（CODEX_V27_PROMPT.md → V27_BUILD_REPORT.md）。Mac サンドボックス制限で生成実行のみ停止したため、生成と検証は VM 側で実施（詳細は V27_BUILD_REPORT.md 追補）。

## 検証証跡（VM側）
- 生成スクリプト内蔵検査 PASS: 16ページ・16 JPEG 1200x630・参照992件の実在確認。
- 独立検証: 全ページ OGP・CTA 機械確認、全画像 JPEG/寸法確認、cwhf シェア画像の目視（現行デザインと同一）。
- 実ブラウザQA（390×844）: 結果画面からの X intent / Web Share text をデコードし、結果ページURLが入ることを確認。r/cwhf.html の 390px 表示をスクリーンショット目視し世界観維持を確認（shot-v27-r-cwhf-390.png）。

## 公開
- commit は本文書と同一コミットで main へ push（ハッシュは git log 参照）。
- 公開URLの HTTP 200（トップ＋結果ページ16＋シェア画像16）は push 後に確認し、日次ログへ記録する。
