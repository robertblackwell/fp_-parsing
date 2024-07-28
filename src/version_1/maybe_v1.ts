//@file_start maybe_v1.md
//@markdown_start
/** 
## Maybe Monad - Version 1

I am introducing this example of a Monad early in the exposition because it will be required
in the next couple of section. However a full treatment of Monads will be delayed until much later
in this paper.

The Haskell __Maybe Monad__ is available in many languages under the name __Optional__, __Nullable__, or __Union with null__.

In TS we can define a type that optionally has a value as `Nullable<T>` which is defined as `T | null`.

However I chose to define a type `TYpe<T>` more like the definition from Haskel.

For the moment I have ommitted many of the __monad__ characteristics. That will be covered in a future section
entitled __Maybe Monad V2__.


*/
//@markdown_end
//@code_start

export type Type<T> = {value: T} | null

export function just<T>(t: T): Type<T> {
    return Object.freeze({value: t})
}
export function nothing<T>(): Type<T> {
    return  null
}
export function isNothing<T>(r: Type<T>): boolean {
        return (r === null)
    }

export function getValue<T>(r: Type<T>): T {
    if(r === null) {
        throw Error("trying to be value from a nothing Maybe")
    }
    return r.value
}
//@code_end
//@markdown_start
/*

## How to use this module

The following code sample demonstrates how to use the `Maybe` module

```ts
import * as Maybe from 'maybe_v1`

const maybevalue: Maybe.Type<string> = Maybe.just("thisisastring")

if(Maybe.isNothing(maybevalue)) {
    //... do something
} else {
    const v = Maybe.getValue(maybevalue)
    // ... do something with v
}

The benefit of this definition is that it more closely follows the Haskel notation, and hence is an aid to understanding.

The implementation as a module with a single type constructor exported is in keeping with the way __OCAML__, __Rescript__, and
__ReasonML__ handle Functors, Applicatives and Monads.

Note some of the characteristics of this definition.

It is not possible to make an instance of `Maybe.Type<T>` that is invalid. There are only 2 
constructors implemented as functions.

The type is opaque, the value property cannot be modified or queried except by the use of the give static function.

Instances of `Maybe<T>` are immutable, doubly so no access to the `value` property and the instances are frozen.
*/
//@markdown_end
//@file_end