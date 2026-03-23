---
title: Pythonのiteratorについて
tags:
  - Python
  - Iterator
private: false
updated_at: '2023-07-20T23:36:16+09:00'
id: d406febe6e2fe4ccf716
organization_url_name: null
slide: false
ignorePublish: false
---
### Pythonの`iterator`とは
* `iterator`とは、可算量のvalueからなるオブジェクトです。
* Pythonでは`iterator`は `iterator protcol`を実装したオブジェクトであり、 `__iter__()` と `__next__()`メソッドからなります。
* `List`, `Tuple`, `Dict`, `Set`などはいずれも`iterable`なコンテナであるため、`iter`, `next`メソッドを持ちます。(明示していないだけでメソッドを含む)

#### 例
```python3
class Line:
    __start: Point
    __end: Point
    __next: Point
    __direction: Direction
    ...
    def __iter__(self) -> Iterator[Point]:
        self.__next = self.__start
        return self

    def __next__(self) -> Point:
        if self.__next == self.__end:
            raise StopIteration
        current = self.__next
        self.__next = Point(
            self.__next.x + self.__direction.x, self.__next.y + self.__direction.y
        )
        return current

```

* 上記例のように、`iteration`を止めるには `StopIteration`を使用します。

### なぜ`iterator`を使うのか
ここでは、なぜ、どのようなケースであれば`List`などの`iterable`なobjectではなく, `iterator`を自分で定義するのか、を考えていきたいと思います。(考察のため、違う、他にもある、などのフィードバックは宝物として受け取ります。コメントいただけると幸いです。)

1. 対象objectが単純なvalueではない
上記の例のように対象objectが単純な`int`などではなく、`class`だが、`iterable`に操作したい場合、明示的に定義するのかと思います。
2. 対象となるobjectのサイズが呼び出されるタイミングでは決定していない
上記例ですと、`Point`は*tuple(int, int)* のため、`List`や`tuple`を組み合わせて表現することも可能に見えますが、実はこのコードでは他の制約によって(ここでは盤面のサイズ)`List`の長さが変わります。`List`を使って表現する場合は制約によって決定したサイズの`List`を渡す必要がありますが、上記コードでは`iterator`の終了条件を自分で決定できるため、より柔軟なコードを書くことが可能になります。
3. 見やすさ
`List`や`tuple`といったデータコンテナは、それ自体どのようなデータを含んでいるのか、なんのためのデータなのかが中身を見ないとわからないですが、`class`では何を扱っているのか、が一目でわかるという明確なメリットがあります。

