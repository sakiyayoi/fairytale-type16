# 童話キャラ16タイプ診断

20の二択から、今日の自分の選び方を童話の登場人物にたとえる診断サイトです。確定仕様は `FINAL_SPEC.md`、質問の土台と文体の方針は `WALLUCHI_CODEX.md` です。

## 開き方・遊び方

1. `index.html` を、JavaScriptが有効なブラウザで開きます。インストールやビルドは不要です。インターネット接続も不要です。
2. 「物語をはじめる」を押し、1ページにつき一つ、自分に近い選択肢を選びます。「ひとつ前のページへ」で答え直せます。
3. 20問に回答すると、キャラ名、肩書き、ひとこと、4軸の回答割合、長所3つ、つまずき2つ、原典の採用場面、相手のタイプが表示されます。
4. 3対2で決まった軸は「ぎりぎり」と表示され、その軸だけを反転した隣のタイプも読めます。
5. 「結果をコピーする」で `私はキャラ名（コード）でした！` の文をコピーできます。自動コピーできない環境では、表示される文章を手動でコピーしてください。
6. 「16タイプの一覧へ」から全員の詳細を読めます。自分の結果はページを閉じたり再読み込みしたりするまで戻って確認でき、「もう一度、診断する」でリセットできます。

## 仕組み

各質問は一つの軸だけを採点し、選んだ極に1点を加えます。各軸5問の多数決なので同点はなく、4軸の組み合わせで全16タイプに到達できます。

| 軸 | 第一極 | 第二極 |
|---|---|---|
| 動き出すきっかけ | Q：自分から動き出す | C：きっかけに応じる |
| 考え始めるところ | R：手がかりから考える | W：可能性から考える |
| 選ぶときの優先条件 | S：筋道を優先する | H：気持ちを優先する |
| 進め方 | P：見通しを立てる | F：流れに合わせる |

- 質問は4軸を1問ずつ、5巡して表示します。データ中の `q01`〜`q12` は壁打ち第3節を土台に調整した質問、`q13`〜`q20` は各軸2問ずつの追加です。
- A/Bの極の並びは診断開始時にランダム化します。第一極がAに来るのは全体で10問、各軸では2問または3問に分散します。戻ったときの順序は変えません。
- 割合は回答数×20%なので、0/20/40/60/80/100%の6段階です。一覧から開くタイプ詳細のバーは、そのタイプの方向だけを示し、個人の回答割合としては表示しません。
- 「一緒にいると楽しい相手」は軸1・軸2を反転し、軸3・軸4を同じにしたコードから自動計算します。8組それぞれに一言を用意しています。
- タイプ定義は `TYPES` の16コードをキーにしたオブジェクト、質問は `QUESTIONS`、計算は `calculateResult`、相手の計算は `companionCode` で確認できます。

## 内容と注記

**これは娯楽のための診断です。** 性格・能力・相性を科学的に判定するものではなく、心理検査や将来の予測でもありません。キャラクターの物語上の運命や、悪役の悪意を回答者に重ねません。つまずきは、長所が行き過ぎたときに起こりうる場面として書いています。

原典の場面を短く言い換え、4極に重ねた創作上の解釈を用いています。採用した作品・版と場面は各タイプの「なぜ、このキャラ？」に記載しています。主にグリム童話、ペローの「シンデレラ」「長ぐつをはいた猫」、アンデルセンの「雪の女王」「人魚姫」、ルイス・キャロルの「不思議の国のアリス」、ジェイコブズ採録の「三匹のこぶた」「ジャックと豆の木」を扱います。人物素材は絵文字のみで、ディズニー作品の画像やデザインは使用していません。

HTML・CSS・JavaScriptはすべて `index.html` に含まれます。外部ライブラリ・外部フォント・外部画像・分析ツールは読み込みません。回答はページ内の変数だけで扱い、保存・送信しません。localStorage、Cookie、データベースは使いません。再読み込みやページを閉じると回答は失われます。URLに回答は含めません。

## 実施した検証

- 抽出したJavaScriptの `node --check`：成功。
- タイプ16件、質問20問、各軸5問：確認済み。全タイプのキャッチ、長所3つ、つまずき2つ、根拠4つ、および確定表の名前・肩書き・モチーフ・色を照合済み。
- 得点分布6通り×4軸＝1,296通りを検査：全16タイプへの到達、多数決、割合、ぎりぎりの軸、隣タイプ、相性計算を確認済み。
- A/Bのランダム配置100回：全体10対10、各軸2対3または3対2を確認済み。
- Node.jsのVMと最小限のDOM代替を用いたロジック検査：20問回答、戻って変更、連打防止、16タイプ詳細、元の結果への復帰、再診断、コピー成功・手動コピーへの切替の分岐が成功。ブラウザでの実操作を確認したものではありません。
- **未確認**：実ブラウザでの画面表示、スマホ実機での操作、実クリップボード。検証環境でChromeが起動時に異常終了（SIGABRT）し、代替のブラウザ操作接続も利用できませんでした。ブラウザが利用可能な環境で `index.html` を開き、390px程度の幅とデスクトップ幅で、20問の回答→結果→相手・隣タイプ→元の結果→コピーを確認してください。

## 構文とデータの確認方法

以下はプロジェクトフォルダで実行します（Node.jsが必要です）。サイト自体の実行にNode.jsは不要です。

```sh
node - <<'NODE'
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fairytale-check-'));
try {
  const file = path.join(dir, 'script.js');
  fs.writeFileSync(file, script);
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
  console.log('node --check: PASS');
  const data = vm.runInNewContext(script.split("const app = document.getElementById('app');")[0] + '\n({ TYPES, QUESTIONS, AXES })');
  assert.equal(Object.keys(data.TYPES).length, 16);
  assert.equal(data.QUESTIONS.length, 20);
  const counts = data.AXES.map((_, axis) => data.QUESTIONS.filter(q => q.axis === axis).length);
  assert.ok(counts.every(n => n === 5));
  for (const type of Object.values(data.TYPES)) {
    assert.ok(type.catch);
    assert.equal(type.strengths.length, 3);
    assert.equal(type.stumbles.length, 2);
    assert.equal(type.evidence.length, 4);
  }
  console.log('タイプ: 16件 / 質問: 20問 / 各軸: ' + counts.join(', ') + '問');
  console.log('全タイプのキャッチ・長所3・つまずき2・根拠4: PASS');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
NODE
```
