# v25 本番反映 報告（2026-11-24）

内容：結果画面の主役ボタンを「結果画像つきでシェアする」に戻し、「Xで投稿する」をサブにした（本人の再決定 2026-11-24 17:47「やはり画像付きでできるようにしたい。結果画像付きでね」）。v24 の主従を入れ替える差し替え。

## 変更内容
- 結果画面のメイン結果ブロック（result-hero）直下の `.share-actions`（personal のみ）の中身を入れ替え：
  1. 主役：`<button class="button primary" data-action="share">結果画像つきでシェアする ↗</button>`（Web Share、{files, text} の渡し方は v23 のまま不変）
  2. サブ：`<a class="button share-sub" href="X intent">Xで投稿する ↗</a>`（小さめ・下、15px／最小高48px）
  3. share-status（1個のみ）
  4. share-fallback の中身は「結果画像の受け皿 img（初期 hidden）→ 画像を保存するボタン」の順
- Web Share が使えない環境で主役を押した場合：無言で終わらせず、生成済みの結果画像を fallback 内に表示し、status に「この環境では画像つき共有が使えません。結果画像を表示しました。画像を保存して、『Xで投稿する』から投稿に添付できます。」を表示する。画像生成自体の失敗時は現行どおり X への誘導文のみ（画像なし）。
- 文面・タグ・診断ロジック・シェア画像の中身・{files, text} の渡し方は無変更。

## 実装経路
- Mac の CLI の Codex に委譲（CODEX_V25_PROMPT.md → V25_BUILD_REPORT.md、codex exec --skip-git-repo-check -s workspace-write、EXIT 正常終了を確認）。Mac 側 index.html は着手前に VM 正本 v24（da23da16…）とハッシュ一致を確認。
- VM 側で全 diff 照合・独立検証・実ブラウザ QA を実施。

## 検証証跡（VM 側）
- git diff は3ハンクのみ（CSS 末尾 V25 ブロック追加／detailHTML の共有ブロック主従入れ替え＋fallback img／shareResult の showFallback 画像表示化）。
- node --check：全2 script PASS。
- 文字単位一致：shareTextFor／shareIntentHref／copyResult／generateShareBlob／downloadShareImage／calculateResult、および AXES・TYPES・QUESTIONS の各セグメントが v24 と完全一致。SHARE_SITE_URL（?v=2付き）・SHARE_HASHTAGS（タグ3つ）・共有引数 `{ files: [file], text: shareTextFor(code) }` も一致。
- 実ブラウザ QA（VM Playwright Chromium、390×844、20問回答→ #result 到達、JS エラーなし）：DOM 順序 hero → share-actions → persona を確認。主役の computed style は背景 rgb(43,36,64)・18px、サブは 15px／48px。share-status・share-fallback は各1個、末尾 actions に share ボタンなし。
- navigator.share が無い環境（この headless 環境は元々 undefined）で主役をクリック：fallback が表示され、生成画像（blob:、1200×630、表示幅358px）が描画され、案内文と「画像を保存する」ボタンが出ることを確認。
- intent URL デコード実測（結果タイプ「シンデレラ」）：text =「童話キャラ16タイプ診断で、私は『シンデレラ』でした。 https://sakiyayoi.github.io/fairytale-type16/?v=2 #童話キャラ16タイプ診断 #性格診断 #タイプ診断」、url パラメータも ?v=2 付きで一致。
- スクリーンショット：shot-v25-result-390.png／shot-v25-result-full-390.png／shot-v25-share-actions-390.png／shot-v25-fallback-390.png（QA 原本は hidden_files/v25-qa/）。目視で主役がヒーロー直下に primary（濃色＋金の縁）で表示され、サブが小さく下に続き、代替表示では生成画像＋案内＋保存ボタンが出ることを確認。

## 正直な注記
- 「スクロールなしで目に入る」について：390×844 実測で share-actions の上端は約870px。ヒーロー自体（挿絵＋タイプ名＋キャッチ）が約794px あり画面高を超えるため、ボタンはヒーローの直後という最速の位置にあるが、初回ビューポート内には収まらない。v24 と同じ既存ヒーローの高さによるもので、今回の仕様（変えるのはボタンの主従と配置、失敗時の表示だけ）ではヒーローを変更していない。
- iPhone 実機・X アプリ内ブラウザでの実動作は未検証（代替表示の仕組みは headless の no-share 環境で実証済み）。

## 公開
- commit は本文書と同一コミットで main へ push（ハッシュは git log 参照）。
- 公開URL https://sakiyayoi.github.io/fairytale-type16/ の HTTP 200 と配信 HTML のハッシュ一致は push 後に確認し、日次ログへ記録する。
