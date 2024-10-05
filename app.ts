import assert = require("assert");

function* getConstrainedBaseClasses(type: { new(...args: any[]): any }): Iterable<{ new(...args: any[]): any }>
{
    if (type !== undefined && type !== null)
    {
        const base = Object.getPrototypeOf(type);

        if (base !== undefined && base !== null)
        {
            if (Object.hasOwn(base, 'constraints') === true)
            {
                yield base;
            }

            for (const t of getConstrainedBaseClasses(base))
            {
                yield t;
            }
        }
    }
}

function constraint<TConstructor extends { new(...args: any[]): TType }, TType>(constraint: (arg: TType) => void): (type: any) => any
{
    return function (type: any): any
    {
        const constrainedBaseClasses = Array.from(getConstrainedBaseClasses(type)).reverse();

        if (constrainedBaseClasses.length > 0)
        {
            if (Object.hasOwn(type, 'constraints') === false)
            {
                Object.defineProperty(type, 'validate',
                    {
                        value: function (obj)
                        {
                            let errors = new Array<Error>();

                            for (const base of constrainedBaseClasses)
                            {
                                // @ts-ignore
                                for (const c of base.constraints)
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

                            for (const c of this.constraints)
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

                Object.defineProperty(type, 'constraints',
                    {
                        value: new Array<Function>(),
                        writable: false,
                        enumerable: true
                    });
            }

            type.constraints.push(constraint);
        }
        else
        {
            if (Object.hasOwn(type, 'constraints') === false)
            {
                Object.defineProperty(type, 'validate',
                    {
                        value: function (obj)
                        {
                            let errors = new Array<Error>();

                            for (const c of this.constraints)
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

                Object.defineProperty(type, 'constraints',
                    {
                        value: new Array<Function>(),
                        writable: false,
                        enumerable: true
                    });
            }

            type.constraints.push(constraint);
        }

        return type;
    }
}

function freeze(type: any): any
{
    if (Object.getOwnPropertyDescriptor(type, 'constraints') !== undefined)
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