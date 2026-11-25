# v27 実装指示（童話キャラ16タイプ診断）

前提：VM 正本 ~/workspace/fairytale-type16、origin/main = v26 commit a343f34 に一致済み。Mac 側に作業コピーがある場合は VM の index.html (SHA は着手前にクロエ提示値と照合) を正として開始すること。一致しなければ作業せず報告。

## 本人の指示（2026-11-25）
共有URLを「その答え専用のURL」にする。現状の共有URLはトップページ（?v=2付き）で開いても結果が出ない。

## 実装内容
### 1. 共有URL差し替え（index.html）
- 新関数/定数: 結果URL = `https://sakiyayoi.github.io/fairytale-type16/r/${code.toLowerCase()}.html`
- `shareTextFor(code)` 内の URL と `shareIntentHref(code)` の text・url パラメータ両方を、そのタイプの結果URLに差し替える。?v=2 は付けない。
- 文面「童話キャラ16タイプ診断で、私は『<name>』でした。」とタグ3つ `#童話キャラ16タイプ診断 #性格診断 #タイプ診断` は文字単位で不変。
- 診断ロジック・QUESTIONS・採点・結果文章（TYPES/FAMILIES/AXES等のデータ文字列）は文字単位で不変。トップ・質問・図鑑フローの動作も変えない。

### 2. 静的結果ページ生成スクリプト（新規 tools/build-result-pages.mjs 等、Node標準のみ・依存追加なし）
- index.html の script から TYPES/FAMILIES/AXES/PAIR_LINES と companion 計算（前2軸反転）を安全に抽出して再利用し、文章をスクリプト側に複製・ハードコードしない。再実行で同じ生成物になる冪等な作りにする。
- 出力: r/<code小文字>.html ×16
- 各ページ内容: そのタイプの結果表示（キャラ絵 ../images/<CODE>.png、タイプ名、title、catch、persona、家系名と説明、モチーフとコード、4診断軸の説明（タイプの方向）、つよさ、気をつけたいところ、恋愛の傾向と注意点、相性相手（companion の絵・名前・pairLine・pairLove、相手ページ r/<friend小文字>.html へのリンク）、出典 evidence/source）＋目立つ「自分のタイプを診断する」ボタン（../index.html へ、primary スタイル）。
- デザイン: index.html の CSS を再利用する形（生成時に index の <style> を取り込む等）で世界観 v17 水彩絵本を維持し、二重管理を最小化。r/ 配下からの相対パス（../images/ 等）を正しくする。結果ページ独自の最小追加CSSは生成テンプレート内に明示。
- 各ページ専用OGP:
  - og:title / twitter:title = `童話キャラ16タイプ診断｜私は『<タイプ名>』でした`
  - og:description = そのタイプの catch を使う
  - og:image / twitter:image = `https://sakiyayoi.github.io/fairytale-type16/images/share/<code小文字>.jpg`（絶対URL）
  - og:url = そのページの絶対URL、og:type=website、twitter:card=summary_large_image、<title> も og:title と同内容

### 3. 静的シェア画像（新規 images/share/<code小文字>.jpg ×16、1200×630）
- 既存 generateShareBlob の見た目と同一にするため、生成処理を二重管理しない方式を取ること。推奨: 生成用の一時ページ/スクリプトで index.html を実ブラウザ（利用可能な headless Chromium/Playwright 等）で開き、generateShareBlob を16タイプ分実行して canvas から JPEG (quality 0.9程度、白背景) で保存する。ブラウザが使えない環境では、その旨と代替手段（同一描画パラメータの Node 再現は最終手段とし、差異を報告）を報告に明記。
- ファイル名は小文字コード .jpg。寸法 1200×630 を全数確認。

### 4. 報告
- V27_BUILD_REPORT.md を作る: 変更ファイル一覧、共有URL差し替え箇所、生成スクリプトの使い方（再生成コマンド）、シェア画像の生成方式、検証結果（script構文検査、データ文字列が不変である照合方法と結果、16ページ生成確認、画像寸法確認）。
- git 操作・push・公開・SNS投稿はしない（push はクロエ側）。

## 完了条件
- index.html の変更は共有URL関連のみ（それ以外はバイト単位で v26 と一致を照合して報告）。
- 生成物16ページ＋16画像が揃う。

## Claude構造レビューの反映（2026-11-25、Opus・設計/構造のみ、結論「致命的問題なし」）
全文は hidden_files/claude_v27_review.txt。必須条件:
1. JPG化: generateShareBlob は変更しない。その PNG を別 canvas に白で全面塗ってから描き、`toBlob('image/jpeg', 0.9)` で書き出す（二重管理回避＋透明→黒化防止）。
2. 画像生成前に `await document.fonts.ready` とロゴ・キャラ絵の load 完了を待つ。
3. og:image / og:url / twitter:image は絶対URL。twitter:card=summary_large_image 必須。各ページに canonical（自ページ絶対URL）。
4. 共有URLは `shareUrlFor(code)` のような単一関数から組み立てる（SHARE_SITE_URL を残して連結し ?v=2 が残る事故を防ぐ）。
5. 生成方式の推奨: Playwright 等の実ブラウザで index.html を開き `page.evaluate` で TYPES/FAMILIES/AXES/PAIR_LINES と companionCode(c) を本体から取得する（vm/正規表現は使わない）。Mac に Playwright が無い場合は利用可能な headless Chromium 経路を報告に明記。
6. 生成後に r/*.html 内の全 src/href を解析し、参照ファイルの実在を検査する（キャラ絵は大文字 images/<CODE>.png、ページと共有画像は小文字）。
7. HTML生成は決定的（並び順・改行固定）。画像再生成はフラグ分離が望ましいが、初回は16枚全生成でよい。
8. 結果ページには図鑑詳細へのリンク `../index.html#type/<CODE>`（「詳しく見る」）も置く。ただし本文セクション（persona・軸・相性等）は設計確定どおり載せる（要約のみに縮めない）。

## 基準ハッシュ
- VM正本 index.html (v26, commit a343f34) SHA-256: 8e99b8321cbb89f0f8caa7264d90e5678732a74eb71bbdb3f8a4c19f0824e900
- Mac側コピーが一致しない場合は、クロエが同期したファイルを使うこと。
