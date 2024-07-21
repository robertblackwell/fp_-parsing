//@file_start functor.md
//@markdown_start
/*
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
//@markdown_end
//@file_end
//@file_start monad.md
//@markdown_start
/*
# Monad
A monad is:

-   a type constructor we will call `M`, that is a generic type with a single argument, 

-   together with a set of free functions

-   They are:
    
    - `fmap(f:(a: A) => B): (ma: M<A>) => M<B>`

    - `eta(a: A): M<A>` often called `pure` or `return`

    - `mu(mma: M<M<A>>): M<A>)`

    - `kliesli: ((f:(a: A) => M<B>): (ma: M<A>) => M<B>`

    - `bind(ma: M<A>, f:(a: A) -> M<B>): M<B>`

    - `liftM(f:(a:A) => B) => ((ma: M<A>) => M<B>)`

    - `kliesliM2 (f:(a:A, b:B) => M<C>): (ma:M<A>, mb: M<B>) => M<C>`

    - `liftM2(op(a:A, b:B) => C) => ((ma: M<A>, mb: M<B>) => M<C>)`

    - `apply(f:(a:A) => B, ma: M<A>): M<B>`
         
Note not all of these functions are independent, that is some can be derived from the others.
 
Generally in this project we will require `fmap`, `eta` and either ``bind` or `mu` to be provided
for each instance of a monad and the others will be derived from those.
        
# A more formal definition of a Monad

A Monad is a triple `(M, eta, mu)` or `(M, eta, bind)`where:

-   `M` is a functor
-   for each type A `eta` is a function `eta(A): (a:A) => M<A>`
-   for each type A `mu` is a function `mu(A): (x:M<M<A>>) => M<A>`
-   for each A `bind` is a function `bind(A,B): (x: M<A>, f: (a:A) => M<B>) => M<B>`


Notice the each of `eta`, `mu` and `bind` is actually a family of functions, one for each `A`. Sometimes in
a formula we need to identify which instance of `eta` or `mu` we are talking about. The convention in CT is to 
provide that information as a subscript. But thats difficult to do in markdown inside of a code block. Hence, in
discussions, we will pretend `eta` and `mu` are function so `eta(A) : A => M<A>`.

The functions `eta` and `mu` must satisfy the rules:

-   `eta` and `mu` are __natural__ in `A`. I might discuss later.
-   `mu(A) . fmap(eta) = identity of A`
-   `mu(A) . mu(M<A>) = mu(A) . fmap(mu(A))`

the equivalent conditions on `eta` and `bind` are:

-   `eta` and `bind` are __natural__ in `A` and `B`. I might discuss later.
-   `bind(A)(x: M<A>, eta(A): A => F<A>) == x`
-   `bind(eta(A)(a), f: A => M<B>) == f(a)`
-   `bind(bind(ma, f), g) == bind(ma, ((x) => bind(f(x), g)))` 

    -   where `g: B => M C` and `f: A => M B`

## Start with the core monad elements

Lets now assume we have a monad defined as a TS module. The details of
the generic type `M<T>` and the functions `fmap`, `eta`, and `mu` 
are left unspecified as we do not wish to use the specific details of any particular monad.

```ts
type M<T> = ...
const fmap<A, B>: (f:(a: A) => B): (ma: M<A>) => M<B> = ...
const eta<A>    : (a:A) => M<A> = ....
const mu<A>     :(a:M<M<A>>) => M<A> = ....
```

Now we will construct some other well known Monad functions from those beginnings.

## `kliesli` Function

The universal property of a Monad M is that for ever `f: A => M<B>` there is a unique
`g: M<A> => M<B>` such that `g . eta(A) = f`. 

In fact `g = mu(M<A>) . fmap(f)`

I like to think of the function `g` as the __Kliesli__ lifting of `f` and to write it as `kliesli(f)`.

Note I have elaborate the steps and the typing to aid understanding of what is happening.

```ts
function kliesli<A,B>(f:(a: A) => M<B>): (ma: M<A>) => M<B> {
    const r1 = fmap(f)
    return function(x:M<A>): M<B> {
        const fmap_f: (x: M<A>) => M<M<B>> = fmap(f)
        const z1: M<M<B>>  = fmap_f(x)
        const z2: M<B> = mu(z1)
        return z2
    }
}
```
### The `bind` function in terms of the `kliesli` function

Haskel defines the `bind` function as an infix operation named `>>=`. TS does not permit custom infix operations so
we have to be content with function of two arguments. To provide motivation 
```ts
const ma: M<A> 
const f: (a:A) => M<B>
const mb: M<B> = (ma >>= f) is the same as kliesli(f)(ms)
```
More formally

```ts
function bind<T,S>(x: M<T>, f: (t:T) => M<S>): M<S> {
    return kliesli(f)(x)
}
```

### The `kliesli` function from `bind`

Going the other way we can define the `kliesli` function in terms of `bind`.

```ts
function kliesli(f:(a:A) => M<B>): (ma: M<A> => M<B>) {
    return function(ma: M<A>): M<B> {
        return bind(ma, f)
    }
}
```
### The `mu` function from `bind`

```ts
function mu(x: M<M<A>): M<A> {
    const identity: M<A> => M<A> = (x) => x
    return bind(x, identity)
}
```

### `liftM` from `bind`

```ts
function liftM(f: (a: A) => B) => ((ma: M<A>) => M<B>) {
    const g: (a: A) => M<B> = (a) => eta(f(a))
    const r: (ma: M<A>) => M<B> = kliesli(g)
}
```

Applying the definition of `kliesli` we see that `liftM(f)(ma) = bind(ma, (a) => eta(f(a))))`.

Also `liftM` is equal to `fmap` by using the monad laws (`mu . fmap(eta) == identity`).

```ts
kliesli(eta . f) = mu . fmap(eta . f) = mu . fmap(eta) . fmap(f) = fmap(f)
```

In simpler notation the type of `liftM` is `(A => B) => (M A => M B)` which looks like the signature of the Haskell function
with the same name. 

## `kliesli` in n-dimensions

A function 
```ts
f: (a:A, b:B) => M<C>
``` 

can be extended to a function 

```ts
fprime: (ta: M<A>, tb: M<B>) => M<C>
```

as follows

```ts
function fprime(ta:M<A>, tb: M<B>): M<C> {
    bind(ta, (a) => bind(tb, (b) => f(a,b)))
}
```
The relationship between `f` and `fprime` defines a function I call __kliesliM2__ where `fprime = kliesliM2(f)`.

This clearly generalizes to function of `n-variables` of the form `f: (a1: A1, a2: A2, ..... an: An) => M<C>`
which can be extended to a function `fprime:(ta1: M<A1>, ta2: M<A2>, ....., tan: M<An>) => M<C>`.

In this n-ary case the previous paragraph defines __kliesliMn__ as `fprime = kliesliMn(f)`

### Monads lift n-ary operations to n-ary operation

Given an n-ary operation and note the return type is `B` not `M<B>` as in the previous section.

```ts
op: (a1: A1, a2: A2, ..... an: An) => B
``` 

Compose the previous function with `eta` to get:
```ts
eta(B) . op: (a1: A1, a2: A2, ..... an: An) => M<B>

```

Finally apply __kliesliMn_ to the composite to get:
```ts
kliesliMn(eta(B) . op): (ta1: M<A>, ..., tan: M<An>) => M<B>
```

This transformation defines a function I will call `Kn`. The TS definition is :

```ts
function Kn(op: (a1: A1, a2: A2, ..... an: An) => B): (ta1: M<A>, ..., tan: M<An>) => M<B> {
    return kliesliMn(eta . op)
}
```  

### k2 and the Haskell `liftM2` function

Specializing to 2-dimensions we get `k2: (op: (a: A, b: B) => C) => (ta: M<A>, tb: M<B>) => M<C>` or
simplifying the notation gives the type of `k2`   as:

```ts
k2: ([A, B] => C) => ([M A, M B] => M C)
```
and then currying the input and output types yields the following.

```ts
k2: ((A => B) => C) => (M A => M B => M C)
```

Which is the same signature as the function called `liftM2` in Haskell

Now lets consider the above for the special case where `op` is the function `apply` defined below

```ts
function apply(f:(a: A) => B, x: A): B {
    return f(x)
}
```

Applying `K2` yields a function of type `(tf: M<((a:A) => B)>, tx: M<A>): M<B>`.

Currying `K2(apply)` changes the type of the resulting function to

```ts
(tf: M<(a:A) => B>) => (tx: M<B> => M<C>)
```

If we translate the type of this function into a more Haskell like form 
and for the moment write `T` for `Type` we get

```
T<A => B> => (T<A> => T<B>)
```

which is precisely the type signature of the Haskell function `lift`.


Removing some of the TS clutter `K2: (A=>B=>C) => (M<A>=>M<B>=>M<C>)`

Now applying the __kliesli_ function yeilds a function `M<A=>B=>C> => 

### K2 is related to the Haskel function `liftA2`.

Recall that in TS the notation `[A, B]` is a 2pule.

Applying `M2` to the function

```ts
function(a:A, b:B): [M<[A,B]>] {return eta([a, b])}
```

yields a function of type `[M<A>, M<B>] => M<[A, B]>`

Consider the function `f:(a: A, f:(a:A) => B): M<B> {return eta(f(a))}`. This can be lifted 
by `kliesliM2` to a function

```ts

kliesli2(f): (ta: M<A>, tf: M<(a:A) => B>): T<B>

```

which through currying is equivalent to a function `(tf: M<(a:A) => B>) => (M<A> => M<B>)`.

This is the Haskel function `<*>`.

The way types are written in TS makes the above somewhat difficult to express and obscures 
what is going on. 

In CT language:

Any function `f: A x B -> M<C>` lifts to a function `kliesli2<f>: M<A> x M<B> -> M<C>`

Applying the previous sentence to the function `eta(AxB): A x B -> M<A x B>` yields a function `M<A> x M<B> -> M<AxB>`.

And applying the same logic to the function `evaluate: ((A => B) x A) -> B` which takes `(f: A=>B, a:A)` to `f(a)`
yields a function `M<(A => B)> -> (M<A> => M<B>)`. Agaiin this the Haskel function `<*>`.    

*/
//@markdown_end
//@ignore_start
/*

## The Haskell `app` or `<*>` function

This might get a bit tricky.

Consider a function `f` of type `((a:A) => B)`. Since `Type` is a generic type we can for the type `M<((a:A)=>B)>`.

If we have a value `z` of type `M<(a:A) => B> can this `z` thing be applied to a value `w` of type `M<A>`>

Do not confuse the type `M<(a:A) => B>` with the function `fmap(f)`.

Moreover the function `fmap(f)` has type `(x:M<A>) => M<B>`.

The question in s=line 3 of this section is about the relationship between `M<((a:A)=>B)>` and `(x:M<A>) => M<B>`.

Below we will define a function `app` which takes a value `ff` of type `M<A=>B>` and a value 'x' of `M<A>`
and __applies__ `ff` to `x` as if `ff` was a function.

In Haskell the resulting value of `M<B>` is written as `ff <*> x` or in our language (without infix operators)
as `app(ff, x)`. 

If we __Curry__ the function `app` we get a function `M<A => B>` => (M<A> => M<B>).

Incidentally the previous line is the key element in the proof that MOnads are always Applicatives.

Lets do a precide definition of `app`.

```ts
app<A, B>(pf: M<(a:A) => B>, pa: M<A>): M<B> {
        const h = (pa: M<A>) => {
            const g = (f: (a:A) => B) => {
                const return_fab = (x:A) => this.eta(f(x))
                return this.bind(pa, return_fab)
            }
            return g
        }
        const bindvalue = this.bind(pf, h(pa)) // pf >>= h(pa) is pf <*> pa 
        return this.kliesli(h(pa))(pf)
    }
```

```ts
app<A, B>(pf: M<(a:A) => B>, pa: M<A>): M<B> {
        function h(pa2: M<A>): (a:A) => M<B> {
            function g (f: (a:A) => B): M<B> {
                const return_fab = (x:A) => eta(f(x))
                return bind(pa2, return_fab)
            }
            return g
        }
        const bindvalue = bind(pf, h(pa)) // pf >>= h(pa) is pf <*> pa 
        return kliesli(h(pa))(pf)
    }
```


## Function liftA2

* This is one of the key applicative functions and the details prove that
     * the existence of an `<*>` operation implies the existence of the `liftA2` function. 
\
```    liftA2<A, B, C>(f: (a: A, b: B) => C): (x: M<A>, y: M<B>) => M<C> {
        const curriedf = (a:A) =>{return (b:B) => f(a,b)}    
        const fmap_curriedf = this.fmap((curriedf))
        const lifted_f = (pa: M<A>, pb: M<B>) => {
            return this.app(fmap_curriedf(pa), pb)
        }
        return lifted_f
    }
```
     * And this is the proof the the existence of `liftA2` implies the existence of `<*>`
    app_another<A, B>(pf: M<(a:A) => B>, pa: M<A>): M<B> {
         * liftA2 implemented using only <*> the alternative applicable definition
         * 
         * @TODO NOTE: something wrong must test
        const uncurried_id = (f: (x:A) => B, a:A) => f(a)
        const lifted_id = this.liftA2(uncurried_id)
        return lifted_id(pf, pa)
    }
}

    class Optional<T> extends M<T> {
        value: T | null
        constructor() {
            super()
            this.value = null
        }
        isNothing<T>(): boolean {
            return this.value == null
        }
        static make(v: T): Optional<T> {
            let obj = new Optional()
            obj.value = v
            return obj
        }
        static nothing() {
            return new Optional()
        }
        just<T>(v: T) {
            let obj = new Optional()
            obj.value = v
            return obj
        }
        getValue<T>(): T {
            return this.value as T
        }
    }
    abstract class OptionalF<T> extends MF<T> {
        fmap<U>(f:(a: T) => U): (ma: M<T>) => M<U> {
            const ff = (ma: Optional<T>) => {
                if(ma.isNothing()) {
                    return Optional.nothing() as Optional<U>
                } else {
                    const vv = Optional.make(f(ma.getValue()))
                    return vv as Optional<U>
                }
            }
            return (ff as any) as ((ma: M<T>) => M<U>)
        }

        eta<A>(a: A) {
            let obj = new Optional<A>()
            obj.value = a
            return obj
        }
    }
        */
//@ignore_end
//@file_end