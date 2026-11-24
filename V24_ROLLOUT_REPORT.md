# v24 本番反映 報告（2026-11-24、仕様変更版）

内容：結果画面の主役ボタンを「Xで投稿する」に変更（本人の決定 2026-11-24 15:14「初めから、Xで投稿！にしよ！」）。旧 v24 指示（画像つきシェアが主役）は本人の仕様変更で停止済みで、push されていなかった（着手時に origin/main = aefac4f を確認）。

## 変更内容
- 結果画面のメイン結果ブロック（result-hero）の直下・persona セクションの前に `.share-actions` を新設（personal のみ）。
  1. 主役：`<a class="button primary" href="X intent">Xで投稿する ↗</a>`（常時表示、金の縁＋深いインク、明朝18px、v17 水彩絵本の世界観）
  2. サブ：`結果を画像つきでシェアする`（Web Share、15px・最小高48px の小さめ表示、primary ではない）
  3. share-status（1個のみ）
  4. share-fallback の中身は「画像を保存する」ボタンだけ（X ボタンの重複なし）
- 末尾 `.actions` から旧シェア一式を削除。コピー・再診断・一覧等は現行どおり。
- 画像生成（generateShareBlob）失敗時：共有を試みず、status に「画像を作れませんでした。文章だけでも投稿できます。『Xで投稿する』をお使いください。」を表示して return（finally で disabled 復帰は維持）。
- showFallback 文言を「この環境では画像つき共有が使えないため、画像の保存ボタンを出しました。文章だけなら『Xで投稿する』をお使いください。」へ変更。
- 文面・タグ・診断ロジック・シェア画像の中身は無変更。

## 実装経路
- Mac の CLI の Codex に委譲（CODEX_V24B_PROMPT.md → V24_BUILD_REPORT.md）。起動時の落とし穴2件を処理：`--full-auto` は現行 Codex で無効（`-s workspace-write` を使用）、git 管理外フォルダのため `--skip-git-repo-check` が必要。
- VM 側で全 diff 照合・独立検証・実ブラウザ QA を実施。

## 検証証跡（VM 側）
- git diff は3ハンクのみ（CSS 末尾 V24 ブロック追加／detailHTML の共有ブロック移動／shareResult の失敗分岐＋showFallback 文言）。
- node --check：全2 script PASS。
- 文字単位一致：shareTextFor／shareIntentHref／copyResult／generateShareBlob／downloadShareImage／calculateResult、および AXES〜detailHTML 手前・TYPES・QUESTIONS の各セグメントが v23 と完全一致。SHARE_SITE_URL（?v=2付き）・SHARE_HASHTAGS（タグ3つ）も一致。
- 実ブラウザ QA（VM headless Chrome、390×844、20問回答→ #result 到達、JS エラーなし）：DOM 順序 hero → share-actions → persona を確認。主役の computed style は背景 rgb(43,36,64)・18px、サブは 15px／48px。share-status・share-fallback は各1個、fallback 内は「画像を保存する」だけ、末尾 actions に share ボタンなし。
- intent URL デコード実測（結果タイプ「眠れる森の美女」）：text =「童話キャラ16タイプ診断で、私は『眠れる森の美女』でした。 https://sakiyayoi.github.io/fairytale-type16/?v=2 #童話キャラ16タイプ診断 #性格診断 #タイプ診断」、url パラメータも ?v=2 付き URL で一致。
- スクリーンショット：shot-v24-result-390.png／shot-v24-result-full-390.png／shot-v24-share-actions-390.png（QA 原本は hidden_files/v24-qa/）。目視で主役ボタンがヒーロー直下に primary（濃色＋金の縁）で表示され、サブが小さく下に続くことを確認。

## 正直な注記
- 「スクロールなしで目に入る」について：390×844 実測で主役ボタンの上端は約950px。ヒーロー自体（挿絵＋タイプ名＋キャッチ）が約862px あり画面高を超えるため、ボタンはヒーローの直後という最速の位置にあるが、初回ビューポート内には収まらない。これは既存ヒーローの高さによるもので、今回の仕様（変えるのはボタンの構成と配置だけ）ではヒーローを変更していない。

## 公開
- commit 4a45c47 を main へ push 済み（aefac4f..4a45c47）。
- 公開URL https://sakiyayoi.github.io/fairytale-type16/ で HTTP 200、配信 HTML の SHA-256 がローカル index.html と一致（da23da16…）。
