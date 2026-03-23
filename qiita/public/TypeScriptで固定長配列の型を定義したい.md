---
title: TypeScriptで固定長配列の型を定義したい
tags:
  - TypeScript
  - 型定義
  - bytearray
  - 固定長配列
private: false
updated_at: '2025-09-10T23:20:17+09:00'
id: 5d23e78c99fff47a0c5c
organization_url_name: null
slide: false
ignorePublish: false
---

# TypeScript で固定長配列の型を定義したい

## 概要

TypeScript でバイト配列やビット配列を使いたいときに、どのように型を定義すればいいかわからなかったため調べてみました。現状として、型で完全に固定長配列を定義することは難しいという結論になりました。

## 調べたこと

### バイト配列の型定義

#### Uint8Array を使ってみる

まず JavaScript でバイト配列をどのように使うかを調べてみました。
JS には、`Uint8Array` が用意されており、これは 8 ビットの符号なし整数の配列を表します。

```javascript
const byteArray = new Uint8Array(10);
byteArray[0] = 1;
byteArray[1] = 256;
byteArray[2] = 300;
console.log(byteArray);

/**
 *  [1, 0, 44]
 * 1 byte: 0 ~ 255のため、
 * 256は0になり、300は44になる
 *
```

#### Uint8Array では固定長にならない

しかし、これには問題があり、`Uint8Array` は固定長配列ではなく、可変長配列です。
そのため、型として利用すると配列長さに対して型チェックができません。

```ts
type Bytes8 = Uint8Array;
const byteArray1: Bytes8 = new Uint8Array(2);
const byteArray2: Bytes8 = new Uint8Array(3);
byteArray1[0] = 1;
byteArray2[0] = 1;
console.log(byteArray1);
console.log(byteArray2);
/**
 *  [1, 0]
 * [1, 0, 0]
 */
```

バイトやビットを扱う場合、例えば 32 ビットや 8 ビットなど、長さが固定のケースが多いと思います。その場合に上記の型では、長さに対して型チェックができません。

#### Tuple を使ってみる

TypeScript では、固定長の型を定義するときに、`Tuple`を使うことができます。
これはデータ構造として`Array`が可変長であるのに対し、`Tuple`は固定長であるためです。
このように書くと、長さを固定した数字の固定長配列を定義することができます。

```typescript
type Bytes8 = [number, number, number, number, number, number, number, number];
const byteArray: Bytes8 = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(byteArray);
/**
 *  [1, 2, 3, 4, 5, 6, 7, 8]
 */

/** 型エラーとなる */
const byteArray2: Bytes8 = [1, 2, 3, 4];
```

上記を汎用的にすると、以下のようになります。

```typescript
type FixedLengthArray<
  T,
  N extends number,
  R extends T[] = []
> = R["length"] extends N ? R : FixedLengthArray<T, N, [...R, T]>;

type Bytes8 = FixedLengthArray<number, 8>;
const byteArray: Bytes8 = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(byteArray);
/**
 *  [1, 2, 3, 4, 5, 6, 7, 8]
 */

/** 型エラーとなる */
const byteArray2: Bytes8 = [1, 2, 3, 4];
```

少しだけ説明すると

- T : 配列の要素の型（例: number や string）
- N : 配列の長さ（数値リテラル）
- R : 今まで積み上げてきたタプル（デフォルトは []）
  として、R の長さが N になったら R を返し、そうでなければ、R に T を追加して再帰的に呼び出すというものです。

#### Tuple では要素の型が不十分

しかしこの書き方にも問題があり、固定長にはできましたが、要素は `byte`ではなく、`number` となってしまいます。`number`は 8 ビットの符号なし整数ではなく、64 ビットの float(浮動小数点数)となってしまうため、以下のようなケースは型チェックできません。

```typescript
type Bytes4 = [number, number, number, number];

/** byteの範囲を超えているため、本来ならエラーとなって欲しいが、型エラーとならない */
const byteArray: Bytes4 = [1, 2.1, 300, -4];
console.log(byteArray);
/**
 *  [1, 2.1, 300, -4]
 */
```

一応以下のようにユニオンを使って書けなくはないですが、これを書くのはあまりやりたくないですね。コストも相応にかかります。

```typescript
type Byte = 0 | 1 | 2 | 3 | ... | 255;
type Bytes4 = [Byte, Byte, Byte, Byte];
const byteArray: Bytes4 = [1, 2.1, 300, -4];
console.log(byteArray);
/**
 *  [1, 2, 3, 4]
 */
```

#### 結局どうするか ①

試行錯誤したのですが、型だけで完全に `Byte` の固定長配列を定義することは難しいと判断しました。そのためまず 1 つ目の方法として、型の要素が `Byte` の範囲に収まるかを validation 関数を用意し、`runtime` でチェックすることにしました。

```typescript
type Byte = number;
type Bytes4 = [Byte, Byte, Byte, Byte];

const validateBytes = (bytes: Bytes4) => {
  if (
    !bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  ) {
    throw new Error(`Invalid Bytes4: ${bytes}`);
  }
};

const byteArray: Bytes4 = [1, 2, 3, 4];
console.log(validateBytes(byteArray));

/** runtime Error */
const byteArray2: Bytes4 = [1, 2.1, 300, -4];
console.log(validateBytes(byteArray2));
```

#### 結局どうするか ②

しかし、この方法だと、validation 関数の使用抜け漏れがあった際にエラーにつながってしまいます。そのため、クラスを用意して、クラスのコンストラクタで validation を行うという方法もあります。

```typescript
type Byte = number;
type Bytes4 = [Byte, Byte, Byte, Byte];

class Bytes4Class {
  private readonly bytes: Bytes4;

  constructor(bytes: Bytes4) {
    this.validateBytes(bytes);
    this.bytes = bytes;
  }

  private validateBytes(bytes: Bytes4) {
    if (
      !bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
    ) {
      throw new Error(`Invalid Bytes4: ${bytes}`);
    }
  }

  get value(): Bytes4 {
    return this.bytes;
  }
}

const ok = new Bytes4Class([1, 2, 3, 4]);
console.log(ok.value); // [1, 2, 3, 4]

/** runtime Error */
const ng = new Bytes4Class([1, 2.1, 300, -4]);
```

この方法だと、クラスのコンストラクタで validation を行うため、使用抜け漏れがなくなります。しかし、一方でクラスを使用することになるため `Bytes4Class`自体はただの `Object`型となってしまい、型チェックとしては弱くなってしまうという問題もあります。

#### 結局どうするか ③

① の方法と似ていますが、`Brand` 型を利用して、固定長配列の要素の型安全性を高める方法です。`Brand`型の詳細は割愛しますが、ベースとなる型が同じでも意味合いが異なる値を別の型として定義することができます。

```typescript
type Brand<T, K> = T & { __brand: K };
type Byte = Brand<number, "Byte">;
type Bytes4 = [Byte, Byte, Byte, Byte];

const createByte = (value: number): Byte => {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error(`Invalid byte value: ${value}`);
  }
  return value as Byte;
};
/** 通常のnumberとByteを区別できる */
const normalNumber: number = 300;
const byteValue: Byte = createByte(255);

/** typeError */
const bytes: Bytes4 = [normalNumber, byteValue, byteValue, byteValue];

/** OK */
const validBytes: Bytes4 = [
  createByte(1),
  createByte(2),
  createByte(3),
  createByte(4),
];

/** runtime Error */
const invalidBytes: Bytes4 = [
  createByte(1),
  createByte(2.1),
  createByte(300),
  createByte(-4),
];
```

この場合、`Byte` 型は `number` 型のサブタイプとなります。`Bytes4` 型は `Byte`のみを要素として持つため、作成時には `Byte` 型を作成する関数 (ここでは `createByte`) を利用して作成する必要があります。作成は面倒となりますが、① でデメリットとして挙げた、`runtime`でのチェック漏れをより防ぎやすくなることが期待できます。

## 結論

上記の 1, 2, 3 ともにメリット、デメリットがあり、どちらを選択するかは状況によります。今回はサービスの拡張性や、作成する型の使用範囲、ケースを考えて、結論として 1 の方法を採用することにしました。しかし、作成する型の使用範囲が拡張される場合は、3 の方法が有効かもしれません。
また型自体が、多くの利用ケースがあり、ビット演算などに限らない多様な使い方が考えられるケースは 2 の方法が有効かもしれません。

### 感想

元を正せば JavaScript には`bit`や`byte`を扱う固定長配列が存在しないということだと思いますが、TypeScript の限界を感じる経験となりました。一方で、再帰による型実装や利用ケースを考えたときにどれが最善かを考えることは良い経験となりました。
