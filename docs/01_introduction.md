<!-- # Parsing, Functional Programming and Categorical Stuff In Typescript -->

# Introduction
## Goal
This project is a personal learning exercise in which my goal is to develop a parser for arithmetic expressions
using the Functional Programming/Category Theoretic machinery of Functors, Applicatives, and Monads.

## Motivation

I have been dabbling with functional programming in Haskell and Ocaml for sometime but have found
it difficult to get my head around. 

This is particular gauling because as well as a programmer I am (or was) a Category Theorist,
and in my Doctoral Dissertation I proved some Theorems about Monads (as least Monads in a 2-category
that in those days were called Doctrines). So I am very familiar with the Category Theory, but have
still found Haskell's interpretation of those concepts difficult to absorb.

So this project is a concerted effort to learn or at least get over the hump.

I have chosen to implement this project in Typescript. 

It is a language I know reasonably well,
has an adequate type system (for most things but as we will see not for this project)
and it is a traditional enough imperative language that any programmer should be able to follow
along as I implement the various concepts. 

## Notation Comparison

I believe the notation used in Haskell, Ocaml and other ML related languages get in the way
of the Category Theorist in me grasping what is going on. Here is a brief discussion of the differences.

FP/Haskell operates in the __Hask__ category where objects are __types__ (as defined by the languages type rules) and arrows are functions between types. 

In CT (an abbreviation for the term Category Theory) objects are upper case whereas in Haskell they are lower eg `A` vs `a`. 

In CT the notation `A -> B` represents a particular arrow/function between two objects. However Haskell has no equivalent diagramatic notation for a single arrow.

The Haskell notation `a -> b` is a type, specifically the type of all arrows from `a` to `b`, and is another object is the Hask category.

The equivalent in CT is <code>B<sup>A</sup></code> or sometimes `[A, B]`, or sometimes `A => B` and is an __object in the Hask category__. This is what makes __Hask__
a __closed category__.  See more below.

So if `M` (or `m` in Haskell) is a functor in CT `M(A->B)` is the functor applied to an arrow `f:A->B`. In Haskell this would be `fmap(f)`.

On the otehrhand the equivalent Haskell notation `m(a-> b)` is the functor applied to the object `a->b`. What a CT'ist would call `M([A,B])`.

This is difference in the meaning of `m(a->b)` has definitely caused me grief and substantially slowed my understanding.

CT represents the __set__ of all arrows from `A` to `B` by `Hom(A, B)`. There is no equivalent in Haskell other than to say
that `ab is a value of type (a -> b)`.

Finally consider pairs. If `A/a` and `B/b` are objects in (CT/Haskell) respectively the type of all pairs is called 

-    `A x B` or <code>A<span>&otimes;</span>B</code> in Category Theory, and 
-   `(a, b)` in Haskell.

Together `AxB` and `[A, B]` make Hask a catersian/monoidal closed category, which is the equiavalent of __currying__.

## An exposition as well as a parser

In addition to providing typescript code that implements an Applicative and/or Monadic parser I hope to explain and document for myself
the various relationships between Applicatives and Monads and their various formulations. I apologize in advance because this additional goal
will force me at times to dive into the category theory and to use more CT like notation.  Hence the next heading is intended to provide a bit of
a reference if things get confusing.

## Notation for this document

- Objects are uppercase. This is consistent with Typescript general usage.
- `A -> B` means a specific arrow from `A` to `B`. 
- `A => B` is the type of arrows from `A` to `B`. Typescript will often insist that I write is `(a:A)=>B`. When a discussion is mainly Category Theoretic I might use `[A, B]` for `A=>B`.
- Functors, Applicatives, Monads are always represented by uppercase letters or a name starting with an uppercase letter, such as `Maybe`.
- Functor application will uses angle brackets `F<A>` (or a Haskell like convention of `F A`) is the functor `F` applied to the object `A`. This is a Typescript requirement.
We might occasionally slip and write `F<A->B>` when we mean `fmap<A->B>`.
- We will generally write `A x B` as the type of pairs of `[A, B]` except when Typescript insists on using the second notation.
- A function that takes `n` arguments is not the same as a function that takes a single `n-tuple`. Nor is it the same as the function 
resulting from full or partial `currying`. These are __equivalent__ (meaning there is an isomorphism that maps one to the other 
and back again) but not the same. Typescript also insists on this differentiation. 

## Two code solutions

I started this project by building a parser for arithmetic expressions using what I thought of as a FP approach
but without using any of the machinery of Functors, Applicatives, Monads. At least not explicitly.

I have kept that solution for the purposes of illustration and comparison in the sub directory `initial-solution`. To run this solution
on some test cases simply enter `ts-node initial-solution/main.ts`

My final solution using the power of Functors, Applicatives and Monads is in the `src` sub directory. The `tests` directory
runs a series of unit tests of the pieces and final solution.

## Anatomy of the solutions

Both the code solutions have broadly the same structure. 

-   A parsing function takes in a character string and produces either some indication of failure or a data structure called an Abstract Syntax Tree an `Ast`. This function is in the file `initial-soluton/parser.ts` for the initial or naive solution and the file `src/parser.ts` for the Categorical solution.

-   There are type definitions and constructor functions for the `Ast` in the files `src/tree/tree.ts` and `src/tree/tree.ts` and these are common to both solutions.
-   The files `stc/tree/walker.ts` contains functions that traverse an `Ast` and either evaluation the arithmetic expression or construct a canonical string representation of the `Ast`. 