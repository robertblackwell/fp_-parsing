<!-- file:docs/03_combining_parsers.md -->
 
# Combining Parsers

It will turn out that our goal of building a parser for arithmetic expressions will be achieved
by combining simpler or more elementary parsers in a number of ways.

## Single Character Parsers

The simplest parser of all is one that successfully parser any single character.

Thus our first example of a parser below is one that parses any single character
whether or not preceeded by whitespace.
 
```ts
/**
 * Match any single non-whitespace character
 */
function parseAnyChar(sinput: string): {maybe_result: Maybe<string>, remaining: string} {
    if(sinput.length ==0)
        return {maybe_result: Maybe.nothing(), remaining: sinput}
    const value = sinput.substring(0,1)
    const remainder = sinput.slice(1)
    return {maybe_result: Maybe.just(value), remaining: remainder}
}
```
 
This can trivially be modified to provide a parse that can successfully parse any 
single digit. Note we have not consumed leading whitespace.
 
```ts
/**
 * Parse a digit without consuming leading white space
 */ 
function parseSingleDigit(sinput: string): {maybe_result: Maybe<string>, remaining: string} {
    const s = sinput.slice(0)
    if((s.length == 0) || (s.substring(0, 1).match(/[0-9]/g) == null)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return makeParserResult(Maybe.just(value), remainder)
}
```
 
It will turnout that a parser that can parse any single character that satisfies
a boolean predicate is a very useful tool.
 
```ts
/**
 * Return a parser that parses the next single character in the input if it satisfies 
 * a predicate
 */
function createPredicateParser(predicate: (ch: string) => boolean): Parser<string> {
    return function(sinput: string){
        if((sinput.length == 0) || (! predicate(sinput.substring(0,1))))
            return makeParserResult(Maybe.nothing(), sinput)
        const value = sinput.substring(0,1)
        const remainder = sinput.slice(1)
        return makeParserResult(Maybe.just(value), remainder)
    }
}
```
 
As the final example of this section we will make a parser that successfully parser
a single whitespace character;
 
```ts
const oneWhitespaceCharacterParser = createPredicateParser((ss) => (ss.substring(0,1).match(/[\s]/g) !== null))
```
 
## The One-or-more parser

Its clear that in order to parser arithmentic expression we will need to be able to parse
numbers which are a sequence of one or more digits.

Above we have a parser that can parse single digits. How to we use that to
parse a sequence of one or more digits.

This is what I think of as the __one-or-more__ parser. 
 
```ts
/*
 * Take a parser for a single character meeting some criteria and return
 * a parser that detects greater than zero consecutive instances of such characters 
*/
function create_OneOrMoreParser(singleChParser: Parser<string>): Parser<string> {
    return function manyTimes(sinput: string): ParserResult<string> {
        let s = sinput.slice(0)
        const {maybe_result: v1, remaining: r1} = singleChParser(s)
        let parse_result = ""
        if(Maybe.isNothing(v1)) {
            return makeParserResult(Maybe.nothing(), r1)
        } else {
            // const pair = Maybe.get_value(r)
            const first_digit_as_string = Maybe.getValue(v1)
            // const remain = pair.remaining_input
            const {maybe_result:v2, remaining:r2} = manyTimes(r1)
            if(Maybe.isNothing(v2)) {
                return makeParserResult(Maybe.just(first_digit_as_string), r1)
            }
            // const result_pair = Maybe.get_value(r2)
            const subsequent_digits_as_string = Maybe.getValue(v2)
            const parse_result_string = first_digit_as_string  + subsequent_digits_as_string
            return makeParserResult(Maybe.just(parse_result_string), r2) 
        }
    }
}
```
 
The experienced Haskel programmer will observe that the `create_OneOrMoreParser()` could have
used more of the `Monad` properties of the `Maybe Monad`. We will come back to that eventually.

The one-or-more constructor makes parsing numbers (a string consisting only of digits) easy. As below.
 
```ts
function parseNumber(sinput: string): ParserResult<string> {
    const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g) !== null))
    const numParser = create_OneOrMoreParser(digitParser)
    const r = numParser(sinput)
    return r
}
```
 
As a second example of the use of the `create_OneOrMoreParser()` lets make a parser that can successfully parse
uppercase words (sequences of upper case letters).
 
```ts
function parseUppercaseWord(sinput: string): ParserResult<string> {
    const upperCaseLetterParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[A-Z]/g) !== null))
    const upperCaseWordParser = create_OneOrMoreParser(upperCaseLetterParser)
    return upperCaseWordParser(sinput)
}
```
 
## Whitespace 

The following strings `2 + 3* (4 +   1)` and `2+3*(4+1)` are equivalent as arithmetic expressions
because whitespace between the terms does not change the interpretation of the expression.  

Thus we have a decision to make. When we parse expressions do we keep track of the white space
so that the exact input string can be recreated from the `Ast` (such as string 1 above),
do we use eliminate whitespace during the parsing process like in string 2 above, or
maybe reduce each sequence of whitespace to a single `space character` like `2 + 3 * ( 4 + 1 )`.

We will chose to eliminate whitespace.

Next we demonstrate how to transform any parser into a parser that ignores leading whitespace.
 
```ts
function isWhitespaceChar(ch: string) {return (ch.substring(0,1).match(/[\s]/g) !== null)}
const oneWhitespaceCharParser = createPredicateParser(isWhitespaceChar)
const whitespaceParser = create_OneOrMoreParser(oneWhitespaceCharParser)
function stripLeadingWhitespace(sinput: string): string {
    let tmp = sinput.slice(0)
    while(true) {
        if(isWhitespaceChar(tmp[0])) {
            tmp = tmp.slice(1)
        } else {
            break
        }
    }
    return tmp
} 
```
 
Hence many of the parser function we design will be required to eliminate all whitespace from the front
of their input string before attempting to parse an input string. 

Consider a parser `const p: (sinput: string) => Maybe<PP<T>>`.

Here is a function that converts that parser `p` to a new parser that strips whitespace from the front of the input
string.
 
```ts
function whitespaceIfy<T>(p: Parser<T>): Parser<T> {
    return function(sinput: string): ParserResult<T> {
        return p(stripLeadingWhitespace(sinput))
    }
}
```
 
## Alternatives or - the OR parser

Consider the task of parsing strings which are either 

-   numbers, a sequence of digits
-   capitalized words, a sequence of uppercase letters

This can be achieved by:

-   first applying `parseNumber()` and if successfull its return value is the return value of our desired parser.
-   if `parseNumber()` fails then apply `parseUppercaseWords()` and use its return value.

In code this looks like:
 
```ts
function parseNumberOrUppercaseWord(sinput: string): ParserResult<string> {
    const {maybe_result, remaining} = parseNumber(sinput)
    if(Maybe.isNothing(maybe_result)) {
        const {maybe_result:v, remaining:rem} = parseUppercaseWord(sinput)
        if(Maybe.isNothing(v))
            return makeParserResult(Maybe.nothing<string>(), remaining)
        const numbstr = Maybe.getValue(v)
        return makeParserResult(Maybe.just<string>(numbstr), rem)
    }
    const s: string = Maybe.getValue(maybe_result)
    return makeParserResult(Maybe.just<string>(s), remaining)
}
```
 
Infact this is a general construct. Given two parsers:

-   `const p1: (s string) => Maybe<PPairClass<T>>`
-   `const p2: (s string) => Maybe<PPairClass<R>>`

We can get a `p1_OR_p2` parser as follows:
 
```ts
function OR_parser<T,R>(p1: Parser<T>,  p2: Parser<R>): Parser<T|R> {
    return function(sinput: string): ParserResult<T|R> {
        const {maybe_result:v1, remaining:r1} = p1(sinput)
        if(Maybe.isNothing(v1)) {
            const {maybe_result:v2, remaining:r2} = p2(sinput)
            if(Maybe.isNothing(v2))
                return makeParserResult(Maybe.nothing<T|R>(), r2)
            else {
                const vv = Maybe.getValue(v2)
                return makeParserResult(Maybe.just<T|R>(vv), r2)
            }
        }
        const tvalue = Maybe.getValue(v1)
        return makeParserResult(Maybe.just<T|R>(tvalue), r1)
    }
}
```
 
## The Followed-By Parser

Lets make a function that will parser variable names. 

Variable names:

-   must start with an upper or lower case letter or an underscore `_`
-   thereafter there may be zero of more characters that are either

    - digits, uppercase letters, lowercase letters or underscores.

Its pretty clear that we can do this by first parsing the initial character with
 
```ts
function isValidFirstChar(s: string): boolean {return (s.substring(0, 1).match(/[a-zA-Z_]/g) !== null)}
function isValidSubsequentChar(s: string): boolean {return (s.substring(0, 1).match(/[a-zA-Z0-9_]/g) !== null)}
const firstCharParser = createPredicateParser(isValidFirstChar)
```
 
and then parsing all of the remaining characters with:
 
```ts
const subsequentCharsParser = create_OneOrMoreParser(createPredicateParser(isValidSubsequentChar))
```
 
So now lets turn our attention to creating a function that combines `firstCharParser` and `sunsequentCharParser` 
as described above.
 
```ts
function parseVariableName(sinput: string): ParserResult<string> {
    const {maybe_result:v1, remaining:r1} = firstCharParser(sinput)
    if(Maybe.isNothing(v1)) {
        return makeParserResult(Maybe.nothing(), r1)
    }
    const first_char = Maybe.getValue(v1)
    const {maybe_result: v2, remaining:r2} = subsequentCharsParser(r1)
    if(Maybe.isNothing(v2)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const subsequent_chars = Maybe.getValue(v2)
    return makeParserResult(Maybe.just(first_char + subsequent_chars), r2)
}
```
 
Again this can be generalized as:
 
```ts
function followedBy<T, U>(p1: Parser<T>, p2: Parser<U>): Parser<[T,U]> {
    return function(sinput: string) {
        const {maybe_result: v1, remaining: r1} = p1(sinput)
        if(Maybe.isNothing(v1)) {
            return makeParserResult(Maybe.nothing(), r1)
        }
        const t1 = Maybe.getValue(v1)
        const {maybe_result: v2, remaining: r2} = p2(r1)
        if(Maybe.isNothing(v2)) {
            return makeParserResult(Maybe.nothing(), sinput)
        }
        const u1 = Maybe.getValue(v2)
        return makeParserResult(Maybe.just([t1, u1]), r2)
    }
}
```
 
Remembering that `Parser<T> = (sinput: string) => Maybe<PP<T>>` we can generalize `followedBy` from a binary operation to an
array operation. Such that a list of parsers can be applied one after the other.
 
```ts
/**
 * You might recognize this as a left_fold operation
 */ 
// function sequence<T>(ps: Array<Parser<T>>): Parser<T> {
//     let p_accum = ps[0]
//     ps.slice(1).forEach((pnext) => {
//         p_accum = followedBy(p_accum, pnext)
//     })
//     return p_accum
// }
```
