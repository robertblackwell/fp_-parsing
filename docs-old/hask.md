# The Hask Category

All the category theory concepts used in Haskell take place in the __Hask__ category where objects are Haskell types
and arrows between two types are Haskel function between those 2 types.

We will use the notation `Hom(A, B)` to be the __set__ of all arrows between `A` and `B`.

## Cartesian Closed Categories

__Hask__ in what a category theorist would call a __Cartesian Closed Category__. This means

-   the category has a __products__ operation between object
    -   for every two objects `A` and `B` in __Hask__ there is another object called `A` x `B` which has certain universal proterties.
    -   the is a special object, the initial object, called `I` such that `I` x `A` <spam>&cong;</span> `A` x `I`  <spam>&cong;</span> `A`  

- the category has internal `Hom`

    -   for every two objects `A` and `B` there is an object in the category called `[A, B]` such that

- and the following special relationship between these two operations

    -   `[I, B]`  <spam>&cong;</span>  `B`
    -   `[A x B, C]`  <spam>&cong;</span> `[A, [B, C]]`
    -   `Hom(A x B, C)`  <spam>&cong;</span> `Hom(A, [B, C])` ... the __Curry Isomorphism__.

## Caveat - are types a single thing or a set of all the possible values a type can take ?

For all of this to work one must __squint__ when looking at `Hask` by sometimes seeing a __type__ as a single thing and
sometimes interpretting a type as the set of all possible values. Thus somethimes `[A, B]` is considered as 
the same as `Hom(A, B)`. 

This is unsatisfactory.

## Currying

Notice that the 3rd of the above relationships is the identity that permits currying of functions.

## Monoidal Category

A monoidal category is a category that has a binary operation between objects that is not necessarily a __product__. For such ccategories 
the `x` operator is replaced by a binary operator called <span>&otimes;</span> and does not have the universal properties of a product.

## Adjunction

The relationships above (curry isomorphism) says that the two functors  `_ x B : Hask -> Hask` and `[B, _] : Hask -> Hask` are __adjoint__ with `_ x B` being 
left adjoint to `[B, ]`

## Unit and counit of the adjuction

Take  `id: A x B -> A x B` and apply the curry relationship to get `unit: A -> [B, A x B]`

Similarly take `id: [A, B] -> [A, B]` and apply reverse currying to get `counit: [A, B] x A -> B`

The `unit` function  is defined as `unit(a): B -> A x B` such that `unit(a)(b) = (a,b)`

The `counit` function is defined by `counit(f, a) = f(a)`. It could be called `eval`

The curry isomporphism can be defined in terms of the `unit` and `counit`.

If `f: A x B -> C` then its curried equivalent is the composition `unit: A -> [B, A x B]` followed by `[B, f]: [B, A x B] -> [B, C]`.

Conversely `g: A -> [B, C]` then its reverse curry equivalent is the composition `g x B: A x B -> [[B, C] x B]` followed by `counit: [[B, C] x B] -> C` 

## Functors between Monoidal (Or even Cartesian) Closed Categories

Let F be a functor from __Hask__ to __Hask__. What is the relationship between:

1.  `F(A) x F(B)` and  `F(A x B)`
2.  `F([A, B])` and `[F(A), F(B)]`

In general the answer is __ there is no relationship__. But there are two special cases.

### Functor - Lax Monoidal

The functor F is lax monoidal if 
    1. for all `A` and `B` there exists a function `nu(A,B) :F(A) x F(B) -> F(A x B)`
    2. for all `A` there exists a function `iotaA: I -> F(I)`

which are __natural__ in A, B , I and satisfying a bunch of coherence rules.

### Functor - Lax Closed

The functor F is lax closed if
    1. for all `A` and `B` there exists a function `zeta(A,B): F([A, B]) -> [F(A), F(B)]` 
    
which is natural in `A` and `B` and satisfy some coherence conditions.

### Functor - In the Hask category Lax monoidal and lax closed are equivalent

See [https://ncatlab.org/nlab/show/closed+functor](https://ncatlab.org/nlab/show/closed+functor)

Assume F is lax monoidal.

Consider `nu([A, B], A): F([A, B]) x F(A) -> F([A, B] x A)` and compose on the right with `F(counit)` to get a function:

```
    F([A, B]) x F(A) -> F(B)
```

Now take the curried equivalent of this function to get a function `F([A, B]) -> [F(A), F(B)]` which is `zeta(A, B)`.

Now assume F is lax closed.

Apply F to the `unit` to get `F(unit): F(A) -> F([B, A x B])`

Now compose on the right with `zeta(B, [A, B])` to get a function `F(A) -> [F(B), F(A x B)]`

Now apply reverse currying to get `F(A) x F(B) -> F(A x B)`

### Functor - Lax monoidal = lax closed = applicative


## Slogans

### 1. Applicative Functors lift n-ary operations

Let `op:: A x B -> C` be a binary operation.

`liftA2(op)` = `F(op)`&#2218;`nu(A, B)` : F(A) x F(B) -> F(C)

This can clearly be extended inductively to n-ary operations 

### 2. Applicative Functors provide a lifting of curried function to curried functions

Left as an exercise for the reader