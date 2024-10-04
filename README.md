# TypeScript Constraints

This project provides a proof-of-concept prototype for a TypeScript constraints system.

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

let obj = new Foo4();

obj.r = 6;
obj.s = 5;
obj.t = 4;
obj.u = 3;
obj.v = 2;
obj.w = 1;

Foo4.validate(obj);
```