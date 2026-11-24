# v26 実装指示（童話キャラ16タイプ診断）

対象は **index.html のみ**（完了報告として V26_BUILD_REPORT.md の新規作成は可）。他のファイルは変更しない。
前提：現行 index.html は v25（commit 5885674、SHA-256 f6e822ab5e3942f9e51c4d4ecff48adc761778eb61f38c5cda99b77f3576cb46）。ここから始めること。着手前にハッシュが一致することを確認し、一致しなければ作業せず報告すること。

## 本人の指示（2026-11-24 18:56）
v25 の結果画面で、ヒーロー（キャラ絵）を少し小さくし、主役ボタン「結果画像つきでシェアする」が最初の画面内（スクロールなし）で見える位置まで上げる。本人の言葉は v25 報告への「お願いします！」。

現状の実測（v25 QA、390×844）：share-actions の上端は約870px。ヒーロー自体が約794px あり、ボタンが初回ビューポート（844px）から外れている。

## 目標
- 390×844 の初回表示（スクロールなし）で、主役ボタン「結果画像つきでシェアする」が**全体**見えること（ボタンの下端が 844px 以内、できれば 820px 以内を目安）。
- 世界観（v17 水彩絵本）とヒーローの見栄えは保つ。小さくしすぎない。目安としてキャラ絵の表示幅は 390px 幅で 260〜300px 程度（全幅の約7割）を想定するが、最終的にはボタン全体が見えることを優先してよい。

## 変えてよいもの（これ以外は変えない）
`<style>` 末尾への **V26 ブロック追加だけ**（既存 CSS 規則は書き換えない）。内容は結果画面ヒーロー周辺の表示サイズと余白のみ：
- `.result-hero` の padding（上を詰める、下 54px を詰める）
- `.result-kicker` の margin を詰める
- `.portrait-frame` の幅を絞って中央寄せにする（例：width: min(74%, 300px); margin-inline: auto）／ `.result-image` はその枠に収まる width:100%・height:auto を維持
- `.result-hero h1` の margin を詰める（フォントサイズ自体は変えない）
- `.catch` の margin を詰める（フォントサイズ・行間は変えない）
- 必要なら `.share-actions` の padding-top を詰める程度は可

## 変えてはいけないもの（文字単位で現行維持）
- 診断ロジック・データ（AXES／FAMILIES／TYPES／QUESTIONS 等）・数値・採点・割合計算を含む全 script
- 文章・文面・タグ・共有の動作（shareTextFor／shareIntentHref／SHARE_SITE_URL／SHARE_HASHTAGS／copyResult／generateShareBlob／downloadShareImage／共有引数 `{ files: [file], text: shareTextFor(code) }` 等）
- 挿絵ファイルそのもの・絵柄・画像パス・HTML 構造（detailHTML 等の生成 HTML は一切変えない）
- トップ画面・図鑑・質問画面の表示（V26 ブロックのセレクタは結果ヒーロー周辺に限定し、他画面へ影響させない。`.result-image` 等の共通クラスへ影響する場合は結果画面の文脈に限定すること）

## 完了条件
- 変更は index.html の `<style>` 末尾 V26 ブロック追加だけ。
- 全 script に node --check 相当の構文検査を行い、結果を報告に書く。
- V26 ブロックを除いた全文が v25 とバイト単位で一致することを確認し、報告に書く。
- V26_BUILD_REPORT.md を作り、変更内容（追加した規則の一覧と狙いの削減量）、触っていないこと、検証結果を明記する。
- git 操作・push・公開・SNS投稿はしない。
