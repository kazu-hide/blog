---
title: C言語の型の範囲
tags:
  - C
private: false
updated_at: '2025-09-10T23:20:16+09:00'
id: 2462e9f66106eda1b4d8
organization_url_name: null
slide: false
ignorePublish: false
---

# C 言語の型の範囲の求め方

## 概要

C 言語には `int` や `char`, `long` などの型があります。
これらの型の範囲は使用環境によって異なりますが、標準ヘッダファイルを使うか、ビット計算をすることで求めることができます。

## コード

```c
#include <stdio.h>
#include <limits.h>

void print_from_limits(void);
void calc_limits(void);

int main(void) {
  print_from_limits();
  calc_limits();
  return 0;
}

void print_from_limits(void) {
  printf("signed char: %hhd から %hhd\n", SCHAR_MIN, SCHAR_MAX);
  printf("unsigned char: %hhu から %hhu\n", 0, UCHAR_MAX);
  printf("signed short: %hd から %hd\n", SHRT_MIN, SHRT_MAX);
  printf("unsigned short: %hu から %hu\n", 0, USHRT_MAX);
  printf("signed int: %d から %d\n", INT_MIN, INT_MAX);
  printf("unsigned int: %u から %u\n", 0, UINT_MAX);
  printf("signed long: %ld から %ld\n", LONG_MIN, LONG_MAX);
  printf("unsigned long: %u から %lu\n", 0, ULONG_MAX);
}

void calc_limits(void) {
  /* unsigned型は 負の値を持たないため、-1するとオーバーフローを起こし、最大値になる */
  printf("Minimum signed char %d\n", -(int)((unsigned char)~0 >> 1) - 1);
  printf("Maximum signed char %d\n", (int)((unsigned char)~0 >> 1));
  printf("Minimum signed short %d\n", -(int)((unsigned short)~0 >> 1) - 1);
  printf("Maximum signed short %d\n", (int)((unsigned short)~0 >> 1));
  printf("Minimum signed int %d\n", -(int)((unsigned int)~0 >> 1) - 1);
  printf("Maximum signed int %d\n", (int)((unsigned int)~0 >> 1));
  printf("Minimum signed long %ld\n", -(long)((unsigned long)~0 >> 1) - 1);
  printf("Maximum signed long %ld\n", (long)((unsigned long)~0 >> 1));
}
```

## 解説

まず標準ヘッダから取得する方法ですが、`#include <limits.h>` で、各型の最小値と最大値を取得できます。

また、ビット計算では、`-(int)((unsigned char)~0 >> 1) - 1)` としていますが、
まず `(unsigned char)0` は全ビットが 0 の型となります。
`~` は NOT 演算子のため、`(unsigned char)~0` は全ビットが 1 の型となります。

例:

`(unsigned char)0` は 00000000
`(unsigned char)~0` は 11111111

そのため、`(unsigned char)~0 >> 1` は 01111111 となります。
これは最上位ビットに存在する符号ビットを 0 にしていることとなります。

つまりこれは、型がとりうる値の正の最大値となります。

これを `int` にキャストすると、`01111111` は `127` となります。

負の最大値は、正の最大値に 1 を足して、マイナスにしたものとなり以下で表すことができます。
そのため、`-(int)((unsigned char)~0 >> 1) - 1)` は `-128` となります。
