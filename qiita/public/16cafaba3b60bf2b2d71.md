---
title: ブラウザでの JavaScript の実行 ~ JavaScript の非同期を理解する 第 3 弾
tags:
  - JavaScript
  - 非同期処理
private: false
updated_at: '2025-06-10T11:35:48+09:00'
id: 16cafaba3b60bf2b2d71
organization_url_name: joolen
slide: false
ignorePublish: false
---
## ブラウザでの JavaScript の実行

JavaScript の非同期を理解する記事の第 3 弾です。

前回は、ECMAScript が定める実行モデルを理解し、JavaScript 実行時になにが起こっているかを概念レベルで理解しました。

[前回の記事: JavaScript 実行モデル](https://qiita.com/ZawaP/private/cff743fc724e72ee3b8c)

今回は、HTML Living Standard を少しだけ読み解き、ブラウザでの JavaScript の実行について概要を理解していきます。 (\*この記事は、JavaScript について勉強した内容をまとめたものであり、内容が不正確な可能性があります。もし指摘などあれば、コメントいただけるととても嬉しいです。)

本記事では、2025 年 4 月 10 日時点での HTML Living Standard を読み解き、ブラウザでの JavaScript の実行として `Event loop` や `Task Queue` を理解していきたいと思います。
[HTML Living Standard](https://html.spec.whatwg.org/)

### 動画を視聴してみよう

さて、いきなり HTML Living Standard を読み解くのは難しいので、まずは 以下の動画を視聴してみてください。
[Further Adventures of the Event Loop - Erin Zimmer - JSConf EU 2018](https://www.youtube.com/watch?v=u1kqx6AenYw)

この動画では、`Event loop` についての概要を説明しています。
そもそも、`Event loop` とは何か？という話ですが、 これは HTML Living Standard の仕様で定義されているものです。

> To coordinate events, user interaction, scripts, rendering, networking, and so forth, user agents must use event loops as described in this section. Each agent has an associated event loop, which is unique to that agent.
>
> The event loop of a similar-origin window agent is known as a window event loop. The event loop of a dedicated worker agent, shared worker agent, or service worker agent is known as a worker event loop. And the event loop of a worklet agent is known as a worklet event loop.

[HTML Living Standard - Event loops] (https://html.spec.whatwg.org/#event-loops) 2025 年 4 月 10 日時点

日本語に訳すると概要としては以下となります。

- `user agent` は、イベントの調整、ユーザーインタラクション、スクリプトの実行、レンダリング処理、ネットワーク処理などを統合的に管理するために、本節で定義される **イベントループ（event loop）** を使用しなければならない。それぞれの`agent`は固有のイベントループを持ち、そのイベントループは他のものと共有されない。

- イベントループは、 **ウィンドウイベントループ（window event loop）** , **ワーカーイベントループ（worker event loop）**, **ワークレットイベントループ（worklet event loop）** の 3 種類がある。

そしてそもそも `user agent` とは何か？という話ですが、これは、平たくいうと実行環境のことです。ECMAScript が定義する `agent` (JavaScript 実行環境の概念)とは別になるため注意してください。正確ではないですが、概念の理解のために、Webブラウザのタブとして読み換えてもらっても良いと思います。

要はブラウザのような実行環境では、ユーザーインタラクション(ボタンクリックやスクロール), ネットワーク処理(HTTP リクエストやレスポンス), レンダリング処理(描画)、スクリプト実行(JavaScript の実行)などを統合的に管理するために、`Event loop`を使用しなければならない。それぞれの実行環境は固有の`Event loop`を持ち、その`Event loop`は他のものと共有されない。(ex.ブラウザのウィンドウと iframe は別々の`Event loop`で管理され独立して動作します。(実際の実行環境ではブラウザごとの違いや仕様と実装の差異もあります。))
と記載されています。

これまで動画などで出てきた `Event loop`とは、まさに、ブラウザ上での`Event loop`のことです。
この`Event loop`が、ブラウザ上で実行する様々な処理の一つとして、JavaScript の実行を管理しています。
それではもう少し具体的に、`Event loop` がどのように 各処理を管理しているかを見ていきましょう。

### Event loop の理解

ここからは HTML Living Standard を読み、`Event loop`の理解を深めていきます。

#### Event loop の構造

- `Event loop` は複数の `task queue` をもちます。(データ構造上は queue ではなく set 型)
- `Event loop` は `microtask queue` をもちます。`microtask queue` は `task queue` ではありません (データ構造も queue 型である)
- `task queue` の中には `task` が存在し、`task` はイベントや HTML パース、コールバック関数などの処理アルゴリズムをカプセル化したものです

#### Event loop の実行

- `Event loop`がどの`task queue`を参照するかは、実装によります。例えば、多くのブラウザではユーザーインタラクションを優先して処理します
- レンダリング処理は、描画タイミングが決まっている。例えば 60Hz のモニターでは 16.66ms ごとに描画処理が行われます。そのため、描画処理タイミングをタイマーで管理し、レンダリングタスクを実行します
- `task`が存在しないアイドリング時には、prefetch 処理や prerender 処理を行います

#### Task の作成、取得

- `task`は、`Event loop`が`task queue`を参照することで取得されます
- `microtask`は、`task`と異なるが、`task`を継承したデータ構造として取得、処理されます

#### Task の実行

- `task queue`から`task`を取得し、`Event loop`が`task`を実行します。同時に実行できる`task`は一つだけです
- `task`実行が終了するたび、`microtask queue`を参照し、`microtask`が存在すれば実行を行います

#### microtask queue について

> 8.1.6.6.4 HostEnqueuePromiseJob(job, realm)
> JavaScript contains an implementation-defined HostEnqueuePromiseJob(job, realm) abstract operation to schedule Promise-related operations. HTML schedules these operations in the microtask queue. User agents must use the following implementation: [JAVASCRIPT] > [HTML Living Standard - microtask](https://html.spec.whatwg.org/#microtask) 2025 年 4 月 10 日時点

- JavaScript の `HostEnqueuePromiseJob` の実装を `microtask queue` で行います

書いてある内容から、非同期処理について重要と思われる部分を抜き出してみました。
これらからわかることとして、まずブラウザは様々なタスクを実行する必要があり、そのタスクは`Event loop`によって管理されているということです。
このタスクは、JavaScript のコードだけでなく、様々な処理があり、人によっては MacroTask などと呼ぶときもあります。
そして、もう一つ `microtask`というもの単語が出てきました。これはまさに、JavaScript の `Promise job` であり、高い優先度で処理される `task`となります。。

`Event loop`は、定められたルールに従って、様々な`Queue`を参照し、`task`を実行します。
そのとき、`task` の実行が終了するたびに、`microtask Queue` を参照し、`microtask` が存在すれば実行を行います。

どうでしょうか。ここまでで読んでいただいたことで、 前回の記事と合わせてJavaScript 実行の概念が理解できてきたのではないでしょうか。

### コードを実行してみよう

上記を理解するステップとして、以下のようなコードを実行してみてください。

```javascript
// これは microtask と macrotask の違いを試すコードです。
// HTML Living Standardの仕様では、macrotaskが完了するたびに、microtaskが存在するかどうかをチェックし
// 存在する場合は、すべてのmicrotaskを実行するとされています。
// このコードでは、macrotask, microtaskの実行順序を確認します。

console.log("start");

// 1つ目のタスク
setTimeout(() => {
  console.log("Callback Task 1");

  // 1つ目のマイクロタスク
  Promise.resolve().then(() => {
    console.log("Micro Task 1");
  });

  // 2つ目のマイクロタスク
  Promise.resolve().then(() => {
    console.log("Micro Task 2");
  });
}, 0);

// 2つ目のタスク
setTimeout(() => {
  console.log("Callback Task 2");

  // 3つ目のマイクロタスク
  Promise.resolve().then(() => {
    console.log("Micro Task 3");
  });
}, 0);

console.log("end");
```

このコードを実行すると、以下のような結果が出力されます。

```
start
end
Callback Task 1
Micro Task 1
Micro Task 2
Callback Task 2
Micro Task 3
```

これは、まさに、`Event loop` の仕様に従って実行されていることを示しています。
`setTimeout` は `task` であり、JavaScript の`Promise` が返すオブジェクトは `microtask` です。
そのため、`task` の実行が完了するたびに、その時点で存在する`microtask`が実行されていることがわかるかと思います。

### まとめ

この記事では、ここまで謎だった `Event loop` や `Task Queue` などの概念を理解するために、HTML Living Standard を読み解きました。

- `Event loop` はブラウザにて、様々なタスクを管理するためのものです
- `Event loop` は `task queue` を参照し、`task` を実行します
- `task queue` と異なる `microtask queue` が存在します
- `microtask queue` は `task queue` とは異なり、JavaScript の仕様として定義された `Promise job`を扱うものです
- `microtask` は `task` よりも優先度が高く、`task` の実行が完了するたびに、その時点で存在する `microtask` が実行されます

もしよければ、ここまで紹介してきた動画をもう一度見てみてください。
最初に見た時よりも理解が深まっているかと思います。
[What the heck is the event loop anyway? | Philip Roberts | JSConf EU](https://youtu.be/8aGhZQkoFbQ?si=yUTzAM0b9Doirb6S)

[Further Adventures of the Event Loop - Erin Zimmer - JSConf EU 2018](https://www.youtube.com/watch?v=u1kqx6AenYw)

### 次回

ここまででようやく、JavaScript の実行モデルの概念を理解できたと思います。次回はここまでのまとめとして、実際に実装されているコードを少しだけ覗きたいと思います。

- これまで色々概念を学んできたけど、実際のコードはどこにあるの？

そんな疑問に答える第 4 章は [**「実装レベルで見る JavaScript の実行」**](https://qiita.com/ZawaP/private/d185453455dd80cc2b68)です。

(\*この記事は、JavaScript について勉強した内容をまとめたものであり、内容が不正確な可能性があります。もし指摘などあれば、コメントいただけるととても嬉しいです。)

### 参考資料

[HTML Living Standard](https://html.spec.whatwg.org/)
[ECMAScript® 262 Language Specification](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html)
[What the heck is the event loop anyway? | Philip Roberts | JSConf EU](https://youtu.be/8aGhZQkoFbQ?si=yUTzAM0b9Doirb6S)
[Further Adventures of the Event Loop - Erin Zimmer - JSConf EU 2018](https://www.youtube.com/watch?v=u1kqx6AenYw)
[JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
