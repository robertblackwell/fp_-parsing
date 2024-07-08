//@markdown 
/** 
## Maybe Monad

I am introducing this example of a Monad early in the exposition because it will be required
in the next couple of section. However a full treatment of Monads will be delayed until much later
in this paper.

The Haskell __Maybe Monad__ is available in many languages under the name __Optional__, __Nullable__, or Union with null.

In TS we can define a type that optionally has a value as `Nullable<T>` which is defined as `T | null`.

However I chose to befine a type `Maybe<T>` more like the definition from Haskel.
*/
//@code_start

export class Maybe<T> {
    private value: T | null
    private constructor(v: T|null) {
        this.value = v
    }
    public static just<T>(t: T): Maybe<T> {
        let obj: Maybe<T> = new Maybe<T>(t)
        return obj
    }
    public static nothing<T>(): Maybe<T> {
        return new Maybe<T>(null)
    }
    public static isNothing<T>(r: Maybe<T>): boolean {
        return (r.value === null)
    }
    public static getValue<T>(r: Maybe<T>): T {
        if(r.value === null) {
            throw Error("trying to be value from a nothing Maybe")
        }
        return r.value
    }
}
//@code_end
//@ignore_start
// class Maybe2<T> {
//     value: T | null
//     constructor() {
//         this.value = null
//     }
//     static nothing<T>(): Maybe2<T> {
//         return new Maybe2()
//     }
//     static just<T>(t: T): Maybe2<T> {
//         let obj = new Maybe2<T>()
//         obj.value = t
//         return obj
//     }
//     static isNothing<T>(mb: Maybe2<T>): boolean {
//         return (mb.value == null)
//     }
//     static getValue<T>(mb: Maybe2<T>): T {
//         if(!mb.value) {
//             throw new Error(`Maybe.getValue error is nothing `)
//         } else {
//             return mb.value
//         }
//     }
// }
//@ignore_end
//@mardown_start
/*
The benefit of this definition is that it more closely follows the Haskel notation, and hence is an aid to understanding.

Note some of the characteristics of this definition.

It is not possible to make an instance of `Maybe<T>` that is invalid. The class constructor is private and there are only 2 
constructors implemented as publis static functions.

The type is opaque, the value property cannot be modified or queried except by the use of the give static function.

Instances of `Maybe<T>` are immutable, doubly so no access to the `value` property and the instances are frozen.
*/