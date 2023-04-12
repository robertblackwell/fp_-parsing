# Parsing

## Arithmetic Expressions

The mission of this project is to build programs that 
-   parses arithmetic expressions into a data structure I will call and `Ast`, 
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

```
    A parser for things
 is a functions from strings
     to lists of pairs
   of things and strings
```

Putting this little rhyme into a definition yields:

```ts

type Parser<T> = (s: string) => Array<[T, string]>

```

While this definition is simple I have decided, after much experimentation, that I dont like it for "real" programs. My reasons:

1.  returning an empty array to signal parsing failed seems like a poor approach for a Functional Programming exercise. Why not use the `Maybe Monad`.
2.  I found no need for a parser to return multiple tuples in any of my experiments in this project.
3.  accessing the elements of a tupe using `tup[0]` and `tup[1]` seems error prone and difficult to change (many edit sites)

Instead I decide to use the following (style) of definition.

```ts
type PPairClass<T> = ....
type Parser<T> = (s: string) => Maybe<PPairClass<T>>)
```
where `PPairClass` is a "pair like" immutable structure that satisfies the following interface. Immutable because the properties `value` and `remaining_input`
are read only.

```ts
interface PPairClass<T> {
    static make<T>(v: T, input: string): PPairClass<T>;
    value: T
    remaining_input: string
}
```

## Abstract Syntax Tree

Most of the parser we deal with will (on success) produce part of a structure called an `Abstract Syntax Tree`. This will be a binary
tree that represents the portion of the tree that they have just parsed.

Ideally we would define the tree in a manner that parallels the BNF definition of an expression. In Haskell Something like:

```haskell

data TreeNode a = 
    PlusNode TreeNode TreeNode
    | MultNode TreeNode TreeNode
    | BracketNode TreeNode
    | NumberNode  string
```

However this or something like it is not possible in Typescript. After a good deal of experimentation I came to the 
following Typescript immitation:

```ts 
    abstract class TreeNode {....}
    class PlusNode extends TreeNode  {left: TreeNode; right: TreeNode}
    class MultNode extends TreeNode  {left: TreeNode; right: TreeNode}
    class BracketNode  extends TreeNode  {left: TreeNode}
    class NumberNode extends TreeNode {value: number}
```

Each concrete class has a static method `make` that creates an instance of the class with the appropriate arguments, as follows:

```ts 
    PlusNode.make(left: TreeNode, right: TreeNode)
    MultNode.make(left: TreeNode, right: TreeNode)
    BracketNode.make(child: TreeNode)
    NumberNode.make(n: number)
```

Whe manipulating TreeNodes one often needs to know the concrete type a `TreeNode`. To facilitate this
there are a set of free functions with names like `isMultNode(node: TreeNode): boolean`
which can be used in an if-ifelse-else chain. Once having determined the concrete type
of a `TreeNode` such a node needs to be "cast" to the appropriate concrete type. There are 
a suite of functions to do this, with error checking. Names like `asMultNode(node: TreeNode): MultNode`.

The above arrangement provides an equivalent to the Haskell `data` statement provided earlier. However
because of the `type casting` type safety depends on hand coded runtime checking.  

## Convenience Node Types

Todo

## Some Simple Parsers

Consider the following simple parser:

```ts
/**
 * Match any single character
 */
function parseAnyChar<string>(sinput: string): Maybe<PPairClass<string>> {
    const s = removewhitespave(sinput)
    if(sinput.length ==0)
        return Maybe.nothing()
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return Maybe.just(PPairClass.make(value, remaiinder))
}
/**
 * Parse a digit if without consuming leading white space
 */ 
function parseSingleDigit(sinput string): Maybe<PPairClass<string>> {
    const s = sinput.slice(0)
    if((s.length == 0) || (s.substring(0, 1).match(/[0-9]/g) == null) {
        return Maybe.nothing()
    }
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return Maybe.just(PPairClass.make(value, remaiinder))
}
/**
 * Return a parser that parses the next single character in the input if it satisfies 
 * a predicate
 */
function createPredicateParser(predicate (ch: string) => boolean): Parser<string> {
    return (s: string) => {
        if((sinput.length == 0) || (! predicate(s.substring(0,1))))
            return Maybe.nothing()
        const value = s.substring(0,1)
        const remainder = s.slice(1)
        return Maybe.just(PPairClass.make(value, remaiinder))
    }
}
```
```ts
/**
 * Take a parser for a single character meeting some criteria and return
 * a parser that detects 
 * one or consecutive instances of such characters 
*/
function createOneOrMoreParser(singleChParser: Parser<string>): Parser<string> {
    function manyTimes(sinput: string) => {
        let s = sinput.slice(0)
        const r = singleChParser(s)
        let parse_result = ""
        if(Maybe.isNothing(r)) {
            return Maybe.nothing()
        }
        const pair = Maybe.get_value(r)
        num = pair.value
        const remain = pair.remaining_input
        const r2 = manyTimes(remain)
        if(!Maybe.isNothing(r2)) {
            const pair2 = Maybe.get_value(r2)
            parse_result = parse_result + pair2.value
            Maybe.just(PPairClass.make(parse_result, pair2.remaining_input)) 
    }
    return manyTimes
}
function parseNumber(sinput string): Maybe<PPairClass<number>> {
    const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g)))
    const numParser = createOneOrMoreParser(digitParser)
    const removewhitespace = (sinput: string) => {
        const s = sinput.slice(sinput)
        const r = createOneOrMoreParser(createPredicateParser((ss) => ss.substring(0,1).match(/[ ]/g) ))(s)
        if(Maybe.isNothing())
    let s = removewhitespace(sinput)
    return numParser(s)
    const r = digit(s)
    let num = ""
    if(Maybe.isNothing(r)) {
        return Maybe.nothing()
    }
    const pair = Maybe.get_value(r)
    num = pair.value
    const remain = pair.remaining_input
    const r2 = number(remain)
    if(!Maybe.isNothing(r2)) {
        const pair2 = Maybe.get_value(r2)
        num = num + pair2.value
        const numberValue = parseInt(num)
        if(isNaN(numberValue))
            throw new Error(`something went wrong` )
        Maybe.just(PPairClass.make(num, pair2.remaining_input)) 
}

```