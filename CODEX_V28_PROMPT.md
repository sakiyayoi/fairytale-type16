# v28 実装指示（童話キャラ16タイプ診断）

前提：VM 正本 ~/workspace/fairytale-type16、origin/main = v27 commit 8bbf070 に一致済み。index.html SHA-256（v27）: 33a155eb56cbcdd122821b43fea0b9b360a495d079a8b3882f786d0fd3b6d2bc。Mac 側コピーが一致しない場合は作業せず報告すること（クロエが同期する）。

## 本人の指示（2026-11-26）
「結果カード作って共有する形にしよ。」共有の中心を、専用に作る「結果カード」画像（正方形 1080×1080、キャラ絵が主役のカード型）にする。現行の横長シェア画像（1200×630）ではない。

## 変更範囲（これ以外は変えない）
- 診断ロジック・QUESTIONS・採点・結果文章（TYPES/FAMILIES/AXES/PAIR_LINES 等のデータ文字列）・文面・タグは文字単位で不変。
- 結果ページ r/*.html の OGP 画像（横長 1200×630、images/share/*.jpg）は不変。tools/build-result-pages.mjs も変えない。
- 既存 generateShareBlob（1200×630）は一切変更しない（OGP静的画像の生成元として残す）。
- 変えるのは「共有画像の形（新規の結果カード生成）」と「主役ボタンの文言」、それに付随するフォールバック表示・保存まわりだけ。

## 実装内容

### 1. 結果カード生成（新規関数 generateResultCardBlob(code)）
- canvas 1080×1080、PNG。素材は既存の生成済み素材のみ（キャラ絵 images/<CODE>.png、ロゴ images/v21/logo-book.png を loadShareImage で読む）。絵をコードで描かない。合成のみ。
- パーセントの出所：個人結果では result.scores を使う（第1極の得点割合 percent0 = round(100*scores[0]/(scores[0]+scores[1]))、axesHTML と同じ計算）。result が無い／コード不一致の場合は axesHTML の非個人時と同じ方向フォールバック（勝ち極 [10,0] / [0,10]）を使う。新しい採点は作らない。
- レイアウト（主役の序列：キャラ絵＞タイプ名＞キャッチ＞軸。余白を広めに、色の役割は 家系色＝枠と装飾／タイプ色＝アクセント／本文色 #302b49）:
  1. 背景は白。最上部に家系色（FAMILIES[code.slice(0,2)].color）の帯 14px。家系色の二重枠（太 4px が inset 18、細 1px が inset 28。現行 generateShareBlob の枠の作法を正方形に読み替える）。
  2. ロゴ：上部中央、幅 330（高さ 110）、y=38。
  3. キャラ絵：中央、380×380、y=190。周りにタイプ色 3px の枠。
  4. 家系チップ行（中央、24px）：「<家系名>の家系 ・ <emoji> <motif>（<CODE>）」y はキャラ絵の下。
  5. タイプ名：中央、700 56px 明朝（現行の書体スタック流用）。1行に収める（最長名でも 900px 幅に収まること）。
  6. タイプ色の短い区切り線（幅 120、高さ 6、中央）。
  7. キャッチコピー：中央、29px、幅 880 で wrapShareLines を使い最大3行、超過は現行方式で末尾「…」に詰める。
  8. 4軸のパーセント表示：キャッチの下に4行。各行＝軸名（22px、左 x=100）＋小さなゲージ（x=290、幅 430、高さ 12、軌道は薄いグレー、充填は家系色で第1極の割合）＋数値（24px、右側に「<第1極> <percent0>% / <第2極> <100-percent0>%」）。勝ち極側の数値はタイプ色で強調してよい（実装方法は任せるが、両極の数値が読めること）。
  9. サイトURL：下部中央、700 25px、タイプ色で「sakiyayoi.github.io/fairytale-type16/」（現行カードと同じ文字列）。枠の内側に収める。
- フォントは現行 generateShareBlob と同じスタック（Hiragino Sans / Hiragino Mincho ProN 等）。document.fonts.ready は呼び出し側の既存フローに任せ、新関数内でも画像 load 完了を待つこと（loadShareImage が担保）。

### 2. 主役ボタンと共有フロー
- detailHTML の主役ボタン文言を「結果画像つきでシェアする」から「結果カードでシェアする」へ変更（primary のまま、ヒーロー直下の位置も不変）。
- shareResult(code, button)：generateShareBlob の代わりに generateResultCardBlob を使う。Web Share は {files:[file], text: shareTextFor(code)} のまま。file 名は `fairytale-<code>-card.png`、type image/png。text の中身（文章＋結果ページURL r/<コード>.html＋タグ3つ #童話キャラ16タイプ診断 #性格診断 #タイプ診断）は文字単位で不変。
- フォールバック（Web Share 不可時）は v25 と同じ型：生成した結果カードを表示し、保存ボタン＋「Xで投稿する」への誘導を出す。表示文と alt は結果カードに合わせて更新してよい（例 alt「診断結果の結果カード」、status「この環境ではカードつき共有が使えません。結果カードを表示しました。画像を保存して、『Xで投稿する』から投稿に添付できます。」）。サブの「Xで投稿する」（shareIntentHref）は不変。
- downloadShareImage も generateResultCardBlob を使い、ダウンロード名は `fairytale-<code>-card.png`。完了 status は「画像を保存しました。Xの投稿に添付してください。」のままでよい（変える場合は報告に明記）。

### 3. 報告
- V28_BUILD_REPORT.md を作る：変更ファイル一覧、generateResultCardBlob のレイアウト実装値、検証結果（script構文検査、データ文字列が不変である照合方法と結果＝v27 index.html との diff が共有まわりだけであることの確認）。
- git 操作・push・公開・SNS投稿はしない（push はクロエ側）。

## 完了条件
- index.html の変更が共有まわり（結果カード生成の新関数、主役ボタン文言、shareResult/downloadShareImage の呼び先とファイル名、フォールバック文・alt）だけであることを diff で照合して報告する。
- generateShareBlob・shareTextFor・shareIntentHref・shareUrlFor はバイト単位で不変。
