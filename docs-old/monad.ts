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

It is difficult to represent a Functor in Typescript in a way where the language enforces all of the requireed element.

Ideally we would do something like this:

```ts
abstract class Functor<T> {
    abstract static fmap(f:(a:A) => B): (a: F<A>) => F<B>;
}
```

but TS does not permit `abstract static methods`. Nor can we make this an interface as interfaces don't sufficietly support statis methods.

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

The idea here is that a function will be inplemented in a module, which in TS means a separate file
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

//@file_end
//@file_start monad.md
//@markdown_start
/*
# Monad
A monad is:
-   a type constructor we will call `M`, that is a generic type with a single argument, 
-   together with a set of functions (that is free functions or statis methods of a class).

-   They are:
    
    - `fmap(f:(a: A) => B): (ma: M<A>) => M<B>`
    - `eta(a: A): M<A>`
    - `mu(mma: M<M<A>>): M<A>)`
    - `kliesli((f:(a: A) => M<B>): (ma: M<A>) => M<B>`
    - `bind(ma: M<A>, f:(a: A) -> M<B>): M<B>`
    - `liftA2:(f:(a:A, b:B) => C): (ma:M<A>, mb: M<B>) => M<C>`
    - `app(f:(a:A) => B, ma: M<A>): M<B>`
         
    -  not all of these functions are independent. That is some can
       be derived from the others.
 
    -  in this project we will require `fmap`, `eta` and `mu` to be provided
       for each instance of a monad and the others:
        
        - kliesli
        - bind
        - liftA2
        - app

        will be derived from those. 

# Monad Definition

A Monad is a triple `(F, eta, mu)` where:

-   `F` is a functor
-   each type A `eta` is a function `eta(A): (a:A) => F<A>`
-   each type A `mu` is a function `mu(A): (x:F<F<A>>) => F<A>`

Notice the each of `eta` and `mu` is actually a family of functions, one for each `A`. Sometimes in
a formula we need to identify which instance of `eta` or `mu` we are talking about. The convention in CT is to 
provide that information as a subscript. But thats difficult to do in markdown inside of a code block. Hence, in
discussions, we will pretend `eta` and `mu` are function sp `eta(A) : A => F<A>`.

The functions `eta` and `mu` must satisfy the rules:

-   `eta` and `mu` are __natural__ in `A`. I might discuss later.
-   `mu(A) . F.fmap(eta) = identity of A`
-   `mu(A) . mu(F<A>) = mu(A) . fmap(mu(A))

## Start with the core monad elements

Lets now assume we have a monad defined as a TS module. The details of
the generic type `Type<T>` and the functions `fmap`, `eta`, and `mu` 
are left unspecified as we do not wish to use the specific details of any particular monad.
```ts
type Type<T> = ...
const fmap<A, B>: (f:(a: A) => B): (ma: Type<A>) => Type<B> = ...
const eta<A>    : (a:A) => Type<A> = ....
const mu<A>     :(a:Type<Type<A>>) => Type<A> = ....
```

Now we will construct some other well known Monad functions from those beginnings.

## Kliesli Function

The universal property of a Monad M is that forever `f: A => M.Type<B>` there is a unique
`g: M.Type<A> => M<B>` sucn that `g . eta(A) = f`. 

In fact `g = mu(M.Type<A>) . M.fmap(f).

I like to think of the function `g` as the Kliesli lifting og `f` nd to write it as `kliesli(f)`.

The following code is inside the module representing `M`. Note I have elaborate with the steps and the typing
to ensure understanding of what is ahppening.

```ts
function kliesli<A,B>(f:(a: A) => Type<B>): (ma: Type<A>) => Type<B> {
    const r1 = fmap(f)
    return function(x:Type<A>): Type<B> {
        const fmap_f: (x: Type<A>) => Type<Type<B>> = fmap(f)
        const z1: Type<Type<B>>  = fmap_f(x)
        const z2: Type<B> = mu(z1)
        return z2
    }
}
```
## The bind function

Haskel defines the `bind` function as an infix operation named `>>=`. TS does not permit custom infix operations so
we have to be content with function of two arguments. To provide motivation 
```ts
const ma: Type<A> 
const f: (a:A) => Type<B>
const mb: Type<B> = (ma >>= f) is the same as kliesli(f)(ms)
```
More formally

```
function bind<T,S>(x: Type<T>, f: (t:T) => Type<S>): Type<S> {
    return this.kliesli(f)(x)
}
```
## Kliesli in n-dimensions and liftA2

A function `f: (a:A, b:B) => Type<C>` can be extended to a function `fprime: (ta: Type<A>, tb: Type<B>) => Type<C>.

The equation for `fprime(ta, tb)` is

```ts
function fprime(ta:Type<A>, tb: Type<B>): Type<C> {
    bind(ta, (a) => bind(tb, (b) => f(a,b)))
}
```
This clearly generalizes to function of `n-variables` of the form `f: (a1: A1, a2: A2, ..... an: An) => Type<C>
which can be extended to a function `fprime:(ta1: Type<A1>, ta2: Type<A2>, ....., tan: Type<An>) => Type<C>.

The relationship between `f` and `fprime` defines a function I call `kliesliA2` where `fprime = kliesliA2(f)`.

KliesliA2 is related to the Haskel function `liftA2`.


Applying `kliesliA2` to the function `function(a:A, b:B): [Type<[A,B]>] {return eta([a, b])}` 
yields a function of type `[Type<A>, Type<B>] => Type<[A, B]>

Consider the function `f:(a: A, f:(a:A) => B): Type<B> {return eta(f(a))}. This can be lifted 
by `kliesliA2` to a function

```ts

kliesli2(f): (ta: Type<A>, tf: Type<(a:A) => B>): T<B>

```

which through currying is equivalent to a function `(tf: Type<(a:A) => B>) => (Type<A> => Type<B>).
This is the Haskel function `<*>`.

The way types are written in TS makes the above somewhat difficult to express and obscures 
what is going on. 

In CT language:

Any function `f: A x B -> Type<C>` lifts to a function `kliesli2<f>: Type<A> x Type<B> -> Type<C>

Applying the previous sentence to the function `eta(AxB): A x B -> Type<A x B>` yields a function `Type<A> x Type<B> -> Type<AxB>`.

And applying the same logic to the function `evaluate: ((A => B) x A) -> B` which takes `(f: A=>B, a:A)` to `f(a)`
yields a function `Type<(A => B)> -> (Type<A> => Type<B>). Agaiin this the Haskel function `<*>`.    




## The Haskell `app` or `<*>` function

This might get a bit tricky.

Consider a function `f` of type `((a:A) => B)`. Since `Type` is a generic type we can for the type `Type<((a:A)=>B)>`.

If we have a value `z` of type `Type<(a:A) => B> can this `z` thing be applied to a value `w` of type `Type<A>`>

Do not confuse the type `Type<(a:A) => B>` with the function `fmap(f)`.

Moreover the function `fmap(f)` has type `(x:Type<A>) => Type<B>`.

The question in s=line 3 of this section is about the relationship between `Type<((a:A)=>B)>` and `(x:Type<A>) => Type<B>`.

Below we will define a function `app` which takes a value `ff` of type `Type<A=>B>` and a value 'x' of `Type<A>`
and __applies__ `ff` to `x` as if `ff` was a function.

In Haskell the resulting value of `Type<B>` is written as `ff <*> x` or in our language (without infix operators)
as `app(ff, x)`. 

If we __Curry__ the function `app` we get a function `Type<A => B>` => (Type<A> => Type<B>).

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
app<A, B>(pf: Type<(a:A) => B>, pa: Type<A>): Type<B> {
        function h(pa2: Type<A>): (a:A) => Type<B> {
            function g (f: (a:A) => B): Type<B> {
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
    /**
     * And this is the proof the the existence of `liftA2` implies the existence of `<*>`
     */
    app_another<A, B>(pf: M<(a:A) => B>, pa: M<A>): M<B> {
        /**
         * liftA2 implemented using only <*> the alternative applicable definition
         * 
         * @TODO NOTE: something wrong must test
         */
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
//@code_end
//@file_end