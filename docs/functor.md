<!-- file:docs/functor.md -->
 
# Functor
## Informally
In this section we are going to discuss the concept of a __Functor__.

In Functional Programming Functors are `type constructors` which take a type (say) `T` and make it into a new type
which is often represented by the notation `F<T>` or `F T`.

So far this looks like a generic type of one variable. However there are additional requirements.

In addition to the type constructor a Functor is required to have an associated  function called `fmap` with the following signature:

```ts
fmap: ((a: A) => B) => (a: F<A>)=>F<B>
```
In addition `fmap` must 

-   take the identity function `identity: A => A` to the identity function `identity: F<A> => F<A>`

-   preserve composition. So if `f: A=>B` and `g:B => C` then

```ts
    fmap(g . f) = fmap(g) . fmap(f)
```

where `.` is the operation of function composition.

Because a Functor takes a type as input and returns a type it is informally a type of function from `Types => Types`.
A category Theorist would call it an __endo functor__ on the categoru __Hask__. 

## Representation in Typescript as a Class

It is difficult to represent a Functor in Typescript in a way where the language enforces all of the required elements and conditions.

Ideally we would do something like this:

```ts
abstract class Functor<T> {
    abstract static fmap(f:(a:A) => B): (a: F<A>) => F<B>;
}
```

but TS does not permit `abstract static methods`. Nor can we make this an interface as interfaces don't sufficietly support static methods.

So I am going to settle for something informal.

## Functor definition

A functor is a pair (F, fmap) where :

-  a `F` is a generic class with one type parameter 
-  and `fmap` is a static method of the class `F` where `F.fmap:((a:A) => B): (a: F<A>)=>F<B>`
-  where F.fmap satisfies the identity and composition rules described above

thus we often write the minimum requirement of a functor in pseudo TS as:

```ts
    class F<T> {
        public static fmap<A,B>(f:(a:A)=>B):(a:F<A> => F<B>) {
            ......
        } 
    }
```

Of course this is not complete class definition as it requires possible properties and definitely a constructor.

For an example see the definition of `Maybe.fmap` in the file `Maybe_v2.ts`

```ts
class Functor<T>{
    fmap<A,B>(f:(a:A) => B): ((x:F<A>)=>F<B>) {}
} 
```
## Representation in Typescript as a Module

The idea here is that a __Functor__ will be inplemented as a TS Module; which in TS means a separate file
with some `export` statments. 

For a functor the module should export a generic type, some contructor functions and other utility functions,
and an `fmap` function.

Consider the following definition of the `Maybe` functor as a module. 
```ts
export type Type<T> = T | null
export function nothing<T>(): Type<T> {return null}
export function just<T>(t:T): Type<T> {return t}
export function isNothing<T>(x: Type<T>): boolean {return x === null}
export function getValue(x: Type<T>): T {
    if(x === null) {
        throw new Error(`trying to get value of nothing`)
    } else {
        return x
    }
}
export function fmap<A,B>(f: (a:A) => B): (x:Type<A>) => Type<B> {
    return function(x: Type<A>): Type<B> {
        if(isNothing(x))
            return nothing()
        else
            return just(f(getValue(x)))
    }
}
```
By convention we will have all modules that are functors export their single generic type with the name `Type`

The user of this Maybe module would use code as follows:

```ts
import * as Maybe from './maybe`

const v: Maybe.Type<string> = Maybe.just("this is a string")

if(Maybe.ifNothing(v)) {
    // do something
} else {
    const internal_value = Maybe.getValue(v)
    .... do something with internal_value
}
```

In the first attempt at a parser for arithmetic expressions we used the `class based` definition of `Maybe`
as that seemed more in keeping with TS from a stylistic point of view.

However going forward we are going to use the `module` approach as it is very similar to the way `OCAML`, `Rescript`
and `ReasonML` package Functors and Monads. Unfortunately TS does not have all the features of those languages so there
will still be some rough spots.
