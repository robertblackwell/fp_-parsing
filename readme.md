# Lessons in, passing, returning and currying, Typescript overloaded function

This branch provides a simple implementation of a parser for aritmetic expressions. The parser builds an __Abstract Syntax Tree__ which can be
traversed recursively by `walker.treeAsString` and `treeAsNumber` to print and evaluate an __AST__ respectively.

This implementation of the parser uses a Fuunctional Approach in that the final parser is built up using combinations of simpler parsers,
but does not use any of the __functional machiery__ such as Functors, Applicatives and Monads.

In a way the point of this implementation is to:

-  show the how to build a parser by combining simple parsers without the confusion of abstract mathematical terminology,
-  to demonstrate the repetition of code patterns that emerge when doing the privious point,
-   in the hope that a programmer not versed in all the FP stuff will get some insight into the __why__ of the mathematical machinery  