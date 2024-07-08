<!-- file:docs/maybe_v2.md -->
 
# Maybe Monad - Version 2

This version has been expanded to contain all the __Monad__ functions.

Wraps a T value or is null - so we have Nullable<T>. 
We could then do the standard TS thiing and check for null before using a Maybe value.
However I wanted the Maybe Monad to be more overtly visible than that approach would have yielded.
 
```ts
export class Maybe2<T> {
    value: T | null
    constructor() {
        this.value = null
    }
    static nothing<T>(): Maybe2<T> {
        return new Maybe2()
    }
    static just<T>(t: T): Maybe2<T> {
        let obj = new Maybe2<T>()
        obj.value = t
        return obj
    }
    static isNothing<T>(mb: Maybe2<T>): boolean {
        return (mb.value == null)
    }
    static getValue<T>(mb: Maybe2<T>): T {
        if(!mb.value) {
            throw new Error(`Maybe.getValue error is nothing `)
        } else {
            return mb.value
        }
    }
    static pure<T>(v: T): Maybe2<T> {
        let obj = Maybe2.just(v) as Maybe2<T>
        return obj
    } 
    /*
    * The definition of a monad
    */
    static eta<T>(v: T): Maybe2<T> {
        return Maybe2.pure(v)
    }
    static mu<T>(mmt: Maybe2<Maybe2<T>>): Maybe2<T> {
        if(Maybe2.isNothing(mmt) || Maybe2.isNothing(Maybe2.getValue(mmt))) {
            return Maybe2.nothing()
        }
        return Maybe2.getValue(Maybe2.getValue(mmt)) as unknown as Maybe2<T>
    }
}
```
 
