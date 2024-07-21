<!-- file:docs/monad.md -->
 
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

Applying the definition of `kliesli` we see that `liftM(f)(ma) = bind(am, (a) => eta(f(a))))`

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

Given an n-ary operation and note the return thpe is `B` not `M<B>` as in the previous section.

```ts
op: (a1: A1, a2: A2, ..... an: An) => B
``` 

Compose the previous function with `eta` to get:
```ts
eta(B) . op: (a1: A1, a2: A2, ..... an: An) => M<B>

```

Finally apply __kliesli2_ to the composite to get:
```ts
kliesliM2(eta(B) . op): (ta1: M<A>, ..., tan: M<An>) => M<B>
```

This transformation defines a function I will call `Kn`. The TS definition is :

```ts
function Kn(op: (a1: A1, a2: A2, ..... an: An) => B): (ta1: M<A>, ..., tan: M<An>) => M<B> {
    return kliesli(eta . op)
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

