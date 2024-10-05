import assert = require("assert");

function* getConstrainedTypes(type: { new(...args: any[]): any }): Iterable<{ new(...args: any[]): any }>
{
    if (type !== undefined && type !== null)
    {
        const base = Object.getPrototypeOf(type);

        for (const t of getConstrainedTypes(base))
        {
            yield t;
        }

        if (Object.hasOwn(type, 'constraints') === true)
        {
            yield type;
        }
    }
}

function constraint<TConstructor extends { new(...args: any[]): TType }, TType>(constraint: (arg: TType) => void): (type: any) => any
{
    return function (type: any): any
    {
        if (Object.hasOwn(type, 'constraints') === false)
        {
            Object.defineProperty(type, 'constraints',
                {
                    value: new Array<Function>(),
                    writable: false,
                    enumerable: true
                });

            Object.defineProperty(type, 'validate',
                {
                    value: function (obj: object)
                    {
                        let errors = new Array<Error>();

                        for (const t of getConstrainedTypes(type))
                        {
                            // @ts-ignore
                            for (const c of t.constraints)
                            {
                                try
                                {
                                    c(obj);
                                }
                                catch (e)
                                {
                                    errors.push(e);
                                }
                            }
                        }

                        if (errors.length == 1)
                        {
                            throw errors[0];
                        }
                        if (errors.length > 1)
                        {
                            throw new AggregateError(errors);
                        }
                    },
                    writable: false,
                    enumerable: true,
                    configurable: false
                });
        }

        type.constraints.push(constraint);

        return type;
    }
}

function freeze(type: any): any
{
    if (Object.hasOwn(type, 'constraints') === true)
    {
        Object.freeze(type.constraints);
    }
    return type;
}

@freeze
@constraint((obj: Foo) => { assert(obj.s >= 0) })
@constraint((obj: Foo) => { assert(obj.r >= 0) })
class Foo
{
    r: number;
    s: number;
}

@freeze
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

@freeze
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

// @ts-ignore
Foo4.validate(obj);