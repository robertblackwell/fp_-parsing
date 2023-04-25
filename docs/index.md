
---
title: My Document
date: September 22, 2020
---

## Test
some text

## Functional Parsing, Functors, Applicatives and Monads

This is an exercise in udnerstanding this stuff

# Parsing, Functional Programming and Categorical Stuff In Typescript

## Introduction
### Goal
This project is a personal learning exercise in which my goal is to develop a parser for arithmetic expressions
using the FP/Category Theory machinery of Functors, Applicatives, and Monads.

### Motivation

I have been dabbling with functional programming in Haskell and Ocaml for sometime but have found
it difficult to get my head around. 

This is particular gauling because as well as a programmer I am (or was) a Category Theorist,
and in my Doctoral Dissertation I proved some Theorems about Monads (as least Monads in a 2-category
that in those days were called Doctrines). So I am very familiar with the Category Theory, but have
still found Haskell and its concepts difficult to absorb (a little later I will touch on why I believe I
have found this stuff difficult).

So this project is a concerted effort to learn.

I have chosen to implement this project in Typescript. It is a language I know reasonably well,
has an adequate type system (for most things but as we will see not for this project)
and it is a traditional enough imperative language that any programmer should be able to follow
along as I implement the various concepts. 

A little later I will touch on the things I wish
Typescript had which would made this a more complete exercise.

### Notation Comparison

I believe the notation used in Haskell, Ocaml and other ML related languages get in the way
of the Category Theorist in me grasping what is going on. A few examples:

1. In CT (Category Theory) the notation 
FP/Haskell operates in the __Hask__ category where objects are __types__ (as defined by the languages type rules) and arrows are functions between types. 

2. In CT (objects upper case) and `A -> B` represents a particular arrow/function between two objects where as Haskell 
has no diagramatic notation for a single arrow and the notation `a -> b` is a type. The
equivalent in CT is `B superscript A` or sometimes `[A, B]` and is an the __object in the category__. This is what makes __Hask__
a __closed category__. So if `M` (or `m` in Haskell) is a functor in CT `M(A->B)` is the functor applied to an arrow `A->B`
whereas the equivalent Haskell notation `m( a-> b)` is the functor applied to the object `a->b`. What a CTist would call `[A,B]`.  
This is difference in the meaning of `m(a->b)` has definitely caused me grief and substantially slowed my understanding.

3. CT represents the set of all arrows from `A` to `B` by `Hom(A, B)`. There is no equivalent in Haskell other than to say
that `ab is a value of type (a -> b)`.

4. Finally consider pairs. If `A/a` and `B/b` are objects in (CT/Haskell) respectively the type of all pairs is called 
respectively `A x B` and `(a, b)`.

### Notation for this document
  
- Objects are uppercase. This is consistent with Typescript general usage.
- `A -> B` means a specific arrow from `A to `B`. 
- `A => B` is the type of arrows from `A` to `B`. Typescript will often insist that I write is `(a:A)=>B`.
- Functors, Applicatives, Monads are always represented by uppercase letters or a name starting with an uppercase letter, such as `Maybe`.
- Functor application will uses angle brackets. `F<A>` is the functor `F` applied to the object `A`. Typescript requirement.
We might occasionally slip and write `F<A->B>` when we mean `fmap<A->B>`.
- We will generally write `A x B` as the type of pairs of `[A, B]` except when Typescript insists on using the second notation.
- A function that takes `n` arguments is not the same as a function that takes a single `n-tuple`. Nor is it the same as the function 
resulting from full or partial `currying`. These are __equivalent__ (meaning there is an isomorphism that maps one to the other 
and back again) but not the same. Typescript also insists on this differentiation. 

### Useful Tricks


