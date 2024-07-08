
# Abstract Syntax Tree

Most of the parser we deal with will (on success) produce part of a structure called an `Abstract Syntax Tree`. This will be a binary
tree that represents the portion of the expression that has just been parsed.

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
    class BracketNode  extends TreeNode  {inside: TreeNode}
    class NumberNode extends TreeNode {value: number}
```

Each concrete class has a static method `make` that creates an instance of the class with the appropriate arguments, as follows:

```ts 
    PlusNode.make(left: TreeNode, right: TreeNode)
    MultNode.make(left: TreeNode, right: TreeNode)
    BracketNode.make(child: TreeNode)
    NumberNode.make(n: number)
```

each of these `make` functions return a `frozen` object to ensure immutability.

When manipulating TreeNodes one often needs to know the concrete type of a `TreeNode`. To facilitate this
there are a set of free functions with names like `isMultNode(node: TreeNode): boolean`
which can be used in an if-ifelse-else chain. Once having determined the concrete type
of a `TreeNode` such a node needs to be "cast" to the appropriate concrete type. There are 
a suite of functions to do this, with error checking. Names like `asMultNode(node: TreeNode): MultNode`.

The above arrangement provides an equivalent to the Haskell `data` statement provided earlier. However
because of the `type casting` type safety depends on hand coded runtime checking.  

Unfortunately this is as close as I can get in Typescript to Haskells pattern matching. 

## Convenience Node Types

Todo

## Some Simple Parsers

Consider the following simple parser:

```ts
/**
 * Match any single character
 */
function parseAnyChar<string>(sinput: string): Maybe<PPairClass<string>> {
    const s = removewhitespace(sinput)
    if(sinput.length ==0)
        return Maybe.nothing()
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return Maybe.just(PPairClass.make(value, remainder))
}
/**
 * Parse a digit without consuming leading white space
 */ 
function parseSingleDigit(sinput string): Maybe<PPairClass<string>> {
    const s = sinput.slice(0)
    if((s.length == 0) || (s.substring(0, 1).match(/[0-9]/g) == null) {
        return Maybe.nothing()
    }
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return Maybe.just(PPairClass.make(value, remainder))
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
/*
 * Take a parser for a single character meeting some criteria and return
 * a parser that detects greater than zero consecutive instances of such characters 
*/
function create_OneOrMoreParser(singleChParser: Parser<string>): Parser<string> {
    function functionManyTimes(sinput: string) => {
        let s = sinput.slice(0)
        const r = singleChParser(s)
        let parse_result = ""
        if(Maybe.isNothing(r)) {
            return Maybe.nothing()
        }
        const pair = Maybe.get_value(r)
        const first_ok_char_as_str = pair.value
        const remain = pair.remaining_input
        const r2 = manyTimes(remain)
        if(Maybe.isNothing(r2)) {
            return Maybe.nothing()
        }
        const result_pair = Maybe.get_value(r2)
        const subsequent_ok_chars_as_string = result_pair.value
        const parse_result_string = first_digit_as_string  + subsequent_digits_as_string
        return Maybe.just(PPairClass.make(parse_result, pair2.remaining_input)) 
    }
    return functionManyTimes
}
function parseNumber(sinput string): Maybe<PPairClass<number>> {
    const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g)))
    const numParser = create_OneOrMoreParser(digitParser)
    const removewhitespace = (sinput: string) => {
        const s = sinput.slice(sinput)
        const r = create_OneOrMoreParser(createPredicateParser((ss) => ss.substring(0,1).match(/[ ]/g) ))(s)
        if(Maybe.isNothing())
    let s = removewhitespace(sinput)
    return numParser(s)
    // const r = digit(s)
    // let num = ""
    // if(Maybe.isNothing(r)) {
    //     return Maybe.nothing()
    // }
    // const pair = Maybe.get_value(r)
    // num = pair.value
    // const remain = pair.remaining_input
    // const r2 = number(remain)
    // if(!Maybe.isNothing(r2)) {
    //     const pair2 = Maybe.get_value(r2)
    //     num = num + pair2.value
    //     const numberValue = parseInt(num)
    //     if(isNaN(numberValue))
    //         throw new Error(`something went wrong` )
    //     Maybe.just(PPairClass.make(num, pair2.remaining_input)) 
}

```