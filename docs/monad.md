<!-- file:docs/monad.md -->
 
# Monad
A monad is:

-   a type constructor we will call `M`, that is a generic type with a single argument, 

-   together with a set of functions (that is free functions or static methods of a class).

-   They are:
    
    - `fmap(f:(a: A) => B): (ma: M<A>) => M<B>`

    - `eta(a: A): M<A>` often called `pure` or `return`

    - `mu(mma: M<M<A>>): M<A>)`

    - `kliesli((f:(a: A) => M<B>): (ma: M<A>) => M<B>`

    - `bind(ma: M<A>, f:(a: A) -> M<B>): M<B>`

    - `kliesliA2: (f:(a:A, b:B) => M<C>): (ma:M<A>, mb: M<B>) => M<C>`

    - `app(f:(a:A) => B, ma: M<A>): M<B>`
         
    Note not all of these functions are independent, that is some can be derived from the others.
 
    Generally in this project we will require `fmap`, `eta` and either ``bind` or `mu` to be provided
    for each instance of a monad and the others will be derived from those.
        
# A more formal definition of a Monad

A Monad is a triple `(F, eta, mu)` or `(F, eta, bind)`where:

-   `F` is a functor
-   each type A `eta` is a function `eta(A): (a:A) => F<A>`
-   each type A `mu` is a function `mu(A): (x:F<F<A>>) => F<A>`
-   each A `bind` is a function `bind(A,B): (x: F<A>, f: (a:A) => F<B>) => F<B>`


Notice the each of `eta`, `mu` and `bind` is actually a family of functions, one for each `A`. Sometimes in
a formula we need to identify which instance of `eta` or `mu` we are talking about. The convention in CT is to 
provide that information as a subscript. But thats difficult to do in markdown inside of a code block. Hence, in
discussions, we will pretend `eta` and `mu` are function so `eta(A) : A => F<A>`.

The functions `eta` and `mu` must satisfy the rules:

-   `eta` and `mu` are __natural__ in `A`. I might discuss later.
-   `mu(A) . F.fmap(eta) = identity of A`
-   `mu(A) . mu(F<A>) = mu(A) . fmap(mu(A))`

the equivalent conditions on `eta` and `bind` are:

-   `eta` and `bind` are __natural__ in `A` and `B`. I might discuss later.
-   `bind(A)(x: F<A>, eta(A): A => F<A>) == x`
-   `bind(eta(A)(a), f: A => F<B>) == f(a)`
-   `bind(bind(ma, f), g) == bind(ma, ((x) => bind(f(x), g)))` 

    -   where `g: B => F C` and `f: A => F B`

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

In fact `g = mu(M.Type<A>) . M.fmap(f)`

I like to think of the function `g` as the __Kliesli__ lifting of `f` and to write it as `kliesli(f)`.

The following code is inside the module representing `M`. 

Note I have elaborate the steps and the typing to aid understanding of what is happening.

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
## The bind function in terms of the kliesli function

Haskel defines the `bind` function as an infix operation named `>>=`. TS does not permit custom infix operations so
we have to be content with function of two arguments. To provide motivation 
```ts
const ma: Type<A> 
const f: (a:A) => Type<B>
const mb: Type<B> = (ma >>= f) is the same as kliesli(f)(ms)
```
More formally

```ts
function bind<T,S>(x: Type<T>, f: (t:T) => Type<S>): Type<S> {
    return kliesli(f)(x)
}
```

## The kliesli function from bind

Going the other way we can define the `kliesli` function in terms of `bind`.

```ts
function kliesli(f:(a:A) => Type<B>): (ma: Type<A> => Type<B>) {
    return function(ma: Type<A>): Type<B> {
        return bind(ma, f)
    }
}
```
## The mu function from bind

```ts
function mu(x: Type<Type<A>): Type<A> {
    const identity: Type<A> => Type<A> = (x) => x
    return bind(x, identity)
}
```
## Kliesli in n-dimensions

A function 
```ts
f: (a:A, b:B) => Type<C>
``` 

can be extended to a function 

```ts
fprime: (ta: Type<A>, tb: Type<B>) => Type<C>
```

as follows

```ts
function fprime(ta:Type<A>, tb: Type<B>): Type<C> {
    bind(ta, (a) => bind(tb, (b) => f(a,b)))
}
```
The relationship between `f` and `fprime` defines a function I call __kliesliA2__ where `fprime = kliesliA2(f)`.

This clearly generalizes to function of `n-variables` of the form `f: (a1: A1, a2: A2, ..... an: An) => Type<C>`
which can be extended to a function `fprime:(ta1: Type<A1>, ta2: Type<A2>, ....., tan: Type<An>) => Type<C>`.

In this n-ary case the previous paragraph defines __kliesliAn__ as `fprime = kliesliAn(f)`

## Monads lift n-ary operations to n-ary operation

Given an n-ary operation `op: (a1: A1, a2: A2, ..... an: An) => B` apply `kliesliAn` to the
function `eta(B) . op: (a1: A1, a2: A2, ..... an: An) => Type<B>`

## KliesliA2 is related to the Haskel function `liftA2`.

Applying `kliesliA2` to the function (recall [A, B] is a tuple)

```ts
function(a:A, b:B): [Type<[A,B]>] {return eta([a, b])}
```

yields a function of type `[Type<A>, Type<B>] => Type<[A, B]>`

Consider the function `f:(a: A, f:(a:A) => B): Type<B> {return eta(f(a))}`. This can be lifted 
by `kliesliA2` to a function

```ts

kliesli2(f): (ta: Type<A>, tf: Type<(a:A) => B>): T<B>

```

which through currying is equivalent to a function `(tf: Type<(a:A) => B>) => (Type<A> => Type<B>)`.

This is the Haskel function `<*>`.

The way types are written in TS makes the above somewhat difficult to express and obscures 
what is going on. 

In CT language:

Any function `f: A x B -> Type<C>` lifts to a function `kliesli2<f>: Type<A> x Type<B> -> Type<C>`

Applying the previous sentence to the function `eta(AxB): A x B -> Type<A x B>` yields a function `Type<A> x Type<B> -> Type<AxB>`.

And applying the same logic to the function `evaluate: ((A => B) x A) -> B` which takes `(f: A=>B, a:A)` to `f(a)`
yields a function `Type<(A => B)> -> (Type<A> => Type<B>)`. Agaiin this the Haskel function `<*>`.    

