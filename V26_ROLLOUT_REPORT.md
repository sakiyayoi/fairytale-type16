# v26 本番反映 報告（2026-11-24）

内容：結果画面のヒーロー（キャラ絵）を少し小さくし、主役ボタン「結果画像つきでシェアする」が 390×844 の初回表示（スクロールなし）で画面内に入るようにした（本人の指示 2026-11-24 18:56、v25 報告への「お願いします！」）。

## 変更内容
- index.html の `<style>` 末尾に V26 ブロック（8行）を追加しただけ。既存 CSS・HTML・script は無変更。
- 対象は personal 結果画面のヒーローだけ（`.result-card:has(> .share-actions) > .result-hero` に限定。図鑑の詳細ヒーローは不変）：
  - ヒーローの padding：上 28px→実効 8px、下 54px→16px
  - result-kicker の margin を圧縮（4px／8px）
  - キャラ絵（portrait-frame）：全幅 390px → width min(70%, 300px) で中央寄せ（390px 幅で実測 273px）。挿絵ファイル・絵柄は不変、表示サイズのみ
  - タイプ名 h1 の margin-top 16px→8px、catch の margin-top 20px→12px（フォントサイズ・行間は不変）
  - share-actions の padding-top 12px→8px

## 実装経路
- Mac の CLI の Codex に委譲（CODEX_V26_PROMPT.md → V26_BUILD_REPORT.md、codex exec --skip-git-repo-check -s workspace-write、正常終了を確認）。着手前に Mac 側 index.html が VM 正本 v25（f6e822ab…）とハッシュ一致することを確認。
- VM 側で全 diff 照合・独立検証・実ブラウザ QA を実施。

## 検証証跡（VM 側）
- git diff は V26 CSS ブロック追加の8行のみ。
- verify26.cjs：全2 script の node --check PASS／script 全文が v25 とバイト単位で一致／V26 ブロックを除いた全文が v25 とバイト単位で一致。診断ロジック・文章・文面・タグ・共有の動作は無変更であることを機械照合で確認。
- 実ブラウザ QA（Chromium、390×844、20問回答→ #result 到達、JS エラーなし、scrollY=0）：
  - ヒーロー高さ 622px（v25 の約794px から約172px 短縮）
  - キャラ絵 実測 273×273px
  - 主役ボタン「結果画像つきでシェアする」：上端 706px・下端 774px → 初回ビューポート（844px）内に全体が収まる
  - サブ「Xで投稿する」も下端 834px で画面内に収まる
- スクリーンショット：shot-v26-result-390.png／shot-v26-result-full-390.png（QA 原本は hidden_files/v26-qa/）。目視で、キャラ絵・タイプ名・キャッチ・主役ボタン・サブボタンまでがスクロールなしで見えること、世界観（水彩絵本）が保たれていることを確認。

## 正直な注記
- iPhone 実機での表示は未検証（390×844 の Chromium 実測で代替）。

## 公開
- commit は本文書と同一コミットで main へ push（ハッシュは git log 参照）。
- 公開URL https://sakiyayoi.github.io/fairytale-type16/ の HTTP 200 と配信 HTML のハッシュ一致は push 後に確認し、日次ログへ記録する。
