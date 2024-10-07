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
                    enumerable: true,
                    configurable: false
                });

            Object.defineProperty(type, 'validate',
                {
                    value: function (obj: object)
                    {
                        let errors = new Array<Error>();

                        for (const t of getConstrainedTypes(this))
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

function precondition(condition: Function): Function
{
    return function (target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor
    {
        if (Object.hasOwn(descriptor.value, 'preconditions') === false)
        {
            let f = descriptor.value;

            descriptor.value = function (...args)
            {
                let errors = new Array<Error>();

                // @ts-ignore
                for (const c of f.__outer__.preconditions)
                {
                    try
                    {
                        c(...args);
                    }
                    catch (e)
                    {
                        errors.push(e);
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

                let r = f(...args);

                // @ts-ignore
                for (const c of f.__outer__.postconditions)
                {
                    try
                    {
                        c(r);
                    }
                    catch (e)
                    {
                        errors.push(e);
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

                return r;
            }

            Object.defineProperty(f, '__outer__',
                {
                    value: descriptor.value,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });

            Object.defineProperty(descriptor.value, 'preconditions',
                {
                    value: new Array<Function>,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });

            Object.defineProperty(descriptor.value, 'postconditions',
                {
                    value: new Array<Function>,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });
        }

        // @ts-ignore
        descriptor.value.preconditions.push(condition);

        return descriptor;
    }
}

function postcondition(condition: Function): Function
{
    return function (target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor
    {
        if (Object.hasOwn(descriptor.value, 'postconditions') === false)
        {
            let f = descriptor.value;

            descriptor.value = function (...args)
            {
                let errors = new Array<Error>();

                // @ts-ignore
                for (const c of f.__outer__.preconditions)
                {
                    try
                    {
                        c(...args);
                    }
                    catch (e)
                    {
                        errors.push(e);
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

                let r = f(...args);

                // @ts-ignore
                for (const c of f.__outer__.postconditions)
                {
                    try
                    {
                        c(r);
                    }
                    catch (e)
                    {
                        errors.push(e);
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

                return r;
            }

            Object.defineProperty(f, '__outer__',
                {
                    value: descriptor.value,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });

            Object.defineProperty(descriptor.value, 'preconditions',
                {
                    value: new Array<Function>,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });

            Object.defineProperty(descriptor.value, 'postconditions',
                {
                    value: new Array<Function>,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });
        }

        // @ts-ignore
        descriptor.value.postconditions.push(condition);

        return descriptor;
    }
}

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

// @ts-ignore
Foo4.validate(obj);

class Foo5
{
    @postcondition((result: Foo) => { assert(result.s > result.r) })
    // @ts-ignore
    @postcondition((result: Foo) => { Foo.validate(result) })
    // @ts-ignore
    @precondition((x: Foo, y: Foo) => { Foo.validate(y) })
    // @ts-ignore
    @precondition((x: Foo, y: Foo) => { Foo.validate(x) })
    fun(x: Foo, y: Foo): Foo
    {
        let r = new Foo();
        r.r = 1;
        r.s = 2;
        return r;
    }
}

let fa = new Foo();
fa.r = 0;
fa.s = 0;

let fb = new Foo();
fb.r = 0;
fb.s = 0;

let f5 = new Foo5();
f5.fun(fa, fb);