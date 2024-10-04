# TypeScript Constraints

This project provides a proof-of-concept prototype for a TypeScript constraint system.

```typescript
@constraint((obj: Foo) => { assert(obj.s >= 0) })
@constraint((obj: Foo) => { assert(obj.r >= 0) })
class Foo
{
    r: number;
    s: number;
}

@constraint((obj: Foo2) => { assert(obj.u >= 0) })
@constraint((obj: Foo2) => { assert(obj.t >= 0) })
class Foo2 extends Foo
{
    t: number;
    u: number;
}

class Foo3 extends Foo2
{
    v: number;
}

@constraint((obj: Foo4) => { assert(obj.w >= 0) })
@constraint((obj: Foo4) => { assert(obj.v >= 0) })
class Foo4 extends Foo3
{
    w: number
}
```