<!-- file:docs/02_parsing_introduction.md -->
 
# Parsing

## Arithmetic Expressions

Recall that the mission of this project is to build a programs that 
-   parses arithmetic expressions into a data structure I will call an `Ast`, 
-   evaluates such a data structure,
-   and prints such a data structure.

Here is a `BNF` specification of arithmetic expressions:

```
    expression  ::= term "+" expression | term
    term        ::= factor "*" term | factor
    factor      ::= number | "(" expression ")"
    number      ::= digit , number | digit  
    digit       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
```

## What is a parser ?

If you read a Haskel text book there is a chance you will find this little rhyme:

```
    A parser for things
 is a functions from strings
     to lists of pairs
   of things and strings
```

Putting this rhyme into a definition yields something like:

```ts

type Parser<T> = (s: string) => Array<[T, string]>

```

While this definition is simple I have decided, after some experimentation, that I dont like it for "real" programs. My reasons:

1.  returning an empty array to signal parsing failed seems like a poor approach for a Functional Programming exercise. Why not use 
`type Optional<T> = T | Null` or the `Maybe Monad`. See the section entitled `Maybe Monad` for details.
2.  I found no need for a parser to return multiple tuples in any of my experiments in this project.
3.  accessing the elements of a tupe using `tup[0]` and `tup[1]` seems error prone and difficult to change (many edit sites)

Instead I decide to use the following (style) of definition. See the section entitled __Maybe Version 1__ for ane explanation
of the Maybe monad.
 
```ts
import {Maybe} from './maybe_v1'

export type ParserResult<T> = {maybe_result: Maybe<T>, remaining: string}
/**May have to change the definition of ParserResult
export type PR<T> = Maybe<[T, string]> 
*/
export function makeParserResult<T>(r: Maybe<T>, rem: string) {
    return {maybe_result: r, remaining: rem}
}
export type Parser<T> = (sinput: string) => {maybe_result: Maybe<T>, remaining: string}
```
