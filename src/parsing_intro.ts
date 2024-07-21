//@file_start 02_parsing_introduction.md
//@markdown_start
/*
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
*/
//@markdown_end
//@code_start
import * as Maybe from './maybe_v1'

export type ParserResult<T> = {maybe_result: Maybe.Type<T>, remaining: string}
/**May have to change the definition of ParserResult
export type PR<T> = Maybe<[T, string]> 
*/
export function makeParserResult<T>(r: Maybe.Type<T>, rem: string) {
    return {maybe_result: r, remaining: rem}
}
export type Parser<T> = (sinput: string) => {maybe_result: Maybe.Type<T>, remaining: string}
//@code_end
//@file_end
//@file_start 03_combining_parsers.md
//@markdown_start
/*
# Combining Parsers

It will turn out that our goal of building a parser for arithmetic expressions will be achieved
by combining simpler or more elementary parsers in a number of ways.

## Single Character Parsers

The simplest parser of all is one that successfully parser any single character.

Thus our first example of a parser below is one that parses any single character
whether or not preceeded by whitespace.
*/
//@markdown_end
//@code_start
/**
 * Match any single non-whitespace character
 */
function parseAnyChar(sinput: string): ParserResult<string> {
    if(sinput.length ==0)
        return {maybe_result: Maybe.nothing(), remaining: sinput}
    const value = sinput.substring(0,1)
    const remainder = sinput.slice(1)
    return {maybe_result: Maybe.just(value), remaining: remainder}
}
//@code_end
//@markdown_start
/*
This can trivially be modified to provide a parse that can successfully parse any 
single digit. Note we have not consumed leading whitespace.
*/
//@markdown_end
//@code_start
/**
 * Parse a digit without consuming leading white space
 */ 
export function parseSingleDigit(sinput: string): ParserResult<string>  {
    const s = sinput.slice(0)
    if((s.length == 0) || (s.substring(0, 1).match(/[0-9]/g) == null)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return makeParserResult(Maybe.just(value), remainder)
}
//@code_end
//@markdown_start
/*
It will turnout that a parser that can parse any single character that satisfies
a boolean predicate is a very useful tool.
*/
//@markdown_end
//@code_start
/**
 * Return a parser that parses the next single character in the input if it satisfies 
 * a predicate
 */
export function createPredicateParser(predicate: (ch: string) => boolean): Parser<string> {
    return function(sinput: string){
        if((sinput.length == 0) || (! predicate(sinput.substring(0,1))))
            return makeParserResult(Maybe.nothing(), sinput)
        const value = sinput.substring(0,1)
        const remainder = sinput.slice(1)
        return makeParserResult(Maybe.just(value), remainder)
    }
}
//@code_end
//@markdown_start
/*
As the final example of this section we will make a parser that successfully parser
a single whitespace character;
*/
//@markdown_end
//@code_start
const oneWhitespaceCharacterParser = createPredicateParser((ss) => (ss.substring(0,1).match(/[\s]/g) !== null))
//@code_end
//@markdown_start
/*
## The One-or-more parser

Its clear that in order to parser arithmentic expression we will need to be able to parse
numbers which are a sequence of one or more digits.

Above we have a parser that can parse single digits. How to we use that to
parse a sequence of one or more digits.

This is what I think of as the __one-or-more__ parser. 
*/
//@markdown_end
//@code_start
/*
 * Take a parser for a single character meeting some criteria and return
 * a parser that detects greater than zero consecutive instances of such characters 
*/
export function create_OneOrMoreParser(singleChParser: Parser<string>): Parser<string> {
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
//@code_end
//@markdown_start
/*
The experienced Haskel programmer will observe that the `create_OneOrMoreParser()` could have
used more of the `Monad` properties of the `Maybe Monad`. We will come back to that eventually.

The one-or-more constructor makes parsing numbers (a string consisting only of digits) easy. As below.
*/
//@markdown_end
//@code_start
export function parseNumber(sinput: string): ParserResult<string> {
    const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g) !== null))
    const numParser = create_OneOrMoreParser(digitParser)
    const r = numParser(sinput)
    return r
}
//@code_end
//@markdown_start
/*
As a second example of the use of the `create_OneOrMoreParser()` lets make a parser that can successfully parse
uppercase words (sequences of upper case letters).
*/
//@markdown_end
//@code_start
function parseUppercaseWord(sinput: string): ParserResult<string> {
    const upperCaseLetterParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[A-Z]/g) !== null))
    const upperCaseWordParser = create_OneOrMoreParser(upperCaseLetterParser)
    return upperCaseWordParser(sinput)
}
//@code_end
//@markdown_start
/*
## Whitespace 

The following strings `2 + 3* (4 +   1)` and `2+3*(4+1)` are equivalent as arithmetic expressions
because whitespace between the terms does not change the interpretation of the expression.  

Thus we have a decision to make. When we parse expressions do we keep track of the white space
so that the exact input string can be recreated from the `Ast` (such as string 1 above),
do we use eliminate whitespace during the parsing process like in string 2 above, or
maybe reduce each sequence of whitespace to a single `space character` like `2 + 3 * ( 4 + 1 )`.

We will chose to eliminate whitespace.

Next we demonstrate how to transform any parser into a parser that ignores leading whitespace.
*/
//@markdown_end
//@code_start
function isWhitespaceChar(ch: string) {return (ch.length > 0) && (ch.substring(0,1).match(/[\s]/g) !== null)}
const oneWhitespaceCharParser = createPredicateParser(isWhitespaceChar)
const whitespaceParser = create_OneOrMoreParser(oneWhitespaceCharParser)
export function stripLeadingWhitespace(sinput: string): string {
    if(sinput.length === 0)
        return sinput
    let tmp = sinput.slice(0)
    while(true) {
        if(isWhitespaceChar(tmp[0]) && tmp.length > 1) {
            tmp = tmp.slice(1)
        } else {
            break
        }
    }
    return tmp
} 
//@code_end
//@markdown_start
/*
Hence many of the parser function we design will be required to eliminate all whitespace from the front
of their input string before attempting to parse an input string. 

Consider a parser `const p: (sinput: string) => Maybe<PP<T>>`.

Here is a function that converts that parser `p` to a new parser that strips whitespace from the front of the input
string.
*/
//@markdown_end
//@code_start
export function whitespaceIfy<T>(p: Parser<T>): Parser<T> {
    return function(sinput: string): ParserResult<T> {
        return p(stripLeadingWhitespace(sinput))
    }
}
//@code_end
//@markdown_start
/*
## Alternatives or - the OR parser

Consider the task of parsing strings which are either 

-   numbers, a sequence of digits
-   capitalized words, a sequence of uppercase letters

This can be achieved by:

-   first applying `parseNumber()` and if successfull its return value is the return value of our desired parser.
-   if `parseNumber()` fails then apply `parseUppercaseWords()` and use its return value.

In code this looks like:
*/
//@markdown_end
//@code_start
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
//@code_end
//@markdown_start
/*
Infact this is a general construct. Given two parsers:

-   `const p1: (s string) => Maybe<PPairClass<T>>`
-   `const p2: (s string) => Maybe<PPairClass<R>>`

We can get a `p1_OR_p2` parser as follows:
*/
//@markdown_end
//@code_start
export const choice = parser_or
export function parser_or<T,R>(p1: Parser<T>,  p2: Parser<R>): Parser<T|R> {
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
//@code_end
//@markdown_start
/*
## The Followed-By Parser

Lets make a function that will parser variable names. 

Variable names:

-   must start with an upper or lower case letter or an underscore `_`
-   thereafter there may be zero of more characters that are either

    - digits, uppercase letters, lowercase letters or underscores.

Its pretty clear that we can do this by first parsing the initial character with
*/
//@markdown_end
//@code_start
function isValidFirstChar(s: string): boolean {return (s.substring(0, 1).match(/[a-zA-Z_]/g) !== null)}
function isValidSubsequentChar(s: string): boolean {return (s.substring(0, 1).match(/[a-zA-Z0-9_]/g) !== null)}
const firstCharParser = createPredicateParser(isValidFirstChar)
//@code_end
//@markdown_start
/*
and then parsing all of the remaining characters with:
*/
//@markdown_end
//@code_start
const subsequentCharsParser = create_OneOrMoreParser(createPredicateParser(isValidSubsequentChar))
//@code_end
//@markdown_start
/*
So now lets turn our attention to creating a function that combines `firstCharParser` and `sunsequentCharParser` 
as described above.
*/
//@markdown_end
//@code_start
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
//@code_end
//@markdown_start
/*
Again this can be generalized as:
*/
//@markdown_end
//@code_start
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
//@code_end
//@markdown_start
/*
When we come to parsing arithmetic expressions we will be faced with the following situation where we need to 
combine 3 separate parsers in sequence.

For example sometimes an arithmetic expression is of the form `expression1 * expression2` such as `(2+5) * (6+5)`.

In this situation we need to parse `expression1` the multiply sign `*` and `expression2` and combine the parsed results
into a new `expression`. 

There are other exaples of
analogous situations.

What we need is a `followBy` function such as 

```ts
function followBy3<T,U>(p1: Parser<T>, p2: Parser<U>, p3: Parser<T>, f:(x:[T,U,T]) => T)`
```
 Here is the definition of such a function.
*/
//@markdown_end
//@code_start
export function followedBy3<R,S,T,U>(pr: Parser<R>, ps: Parser<S>, pt: Parser<T>, f:(r: R, s:S, t:T) => U):Parser<U> {
    return function(sinput: string): ParserResult<U> {
        const {maybe_result: rv, remaining: rem1} = pr(sinput)
        if(Maybe.isNothing(rv)) {
            return makeParserResult(Maybe.nothing(), rem1)
        }
        const rval = Maybe.getValue(rv)
        const {maybe_result: sv, remaining: rem2} = ps(rem1)
        if(Maybe.isNothing(sv)) {
            return makeParserResult(Maybe.nothing(), sinput)
        }
        const sval = Maybe.getValue(sv)
        const {maybe_result: tv, remaining: rem3} = pt(rem2)
        if(Maybe.isNothing(tv)) {
            return makeParserResult(Maybe.nothing(), sinput)
        }
        const tval = Maybe.getValue(tv)

        return makeParserResult(Maybe.just(f(rval, sval, tval)), rem3)
    } 
}
//@code_end
//@markdown_start
/*
*/
/*
Remembering that `Parser<T> = (sinput: string) => Maybe<PP<T>>` we can generalize `followedBy` from a binary operation to an
array operation. Such that a list of parsers can be applied one after the other.
*/
//@markdown_end
//@code_start
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
//@code_end
//@file_end
//@file_start junk.md
//@ignore_start
/**
 * Lets test some of the above functions
 */
function assert_parser_result<T>(pr: ParserResult<T>, value: Maybe.Type<T>, remainder: string) {
    const {maybe_result, remaining} = pr
    if(remainder !== remaining) {
        console.log(`assert_parser_result failed remaining: ${remaining} does not equal ${remainder}`)
    }
    if( ((!Maybe.isNothing(maybe_result)) && Maybe.isNothing(value)) || ((Maybe.isNothing(maybe_result)) && (!Maybe.isNothing(value)))){
        console.log(`assert_parser_result failed one value is nothing and the other is not`)
    }
    if((!Maybe.isNothing(maybe_result)) && (!Maybe.isNothing(value))) {
        const v1 = Maybe.getValue(maybe_result)
        const v2 = Maybe.getValue(value)
        if(v1 !== v2) {
            console.log(`assert_parser_result v1:${v1} !== v2:${v2}`)
        }
    } 
}
function test_number() {
    assert_parser_result(parseNumber("12345ABCDEF"), Maybe.just("12345"), "ABCDEF")
    assert_parser_result(parseNumber(" 12345ABCDEF"), Maybe.nothing(), " 12345ABCDEF")
    console.log("test_number done")
}
function test_number_or_word() {
    assert_parser_result(parseNumberOrUppercaseWord("12345ABCDEF"), Maybe.just("12345"), "ABCDEF")
    assert_parser_result(parseNumberOrUppercaseWord("ABCDEF12345"), Maybe.just("ABCDEF"), "12345")
    console.log("test_number_or_word done")
}
function test_variable_name() {
    assert_parser_result(parseVariableName("athing_12345-xyz"), Maybe.just("athing_12345"), "-xyz")
    assert_parser_result(parseVariableName("_athing_12345-xyz"), Maybe.just("_athing_12345"), "-xyz")
    assert_parser_result(parseVariableName("1athing_12345-xyz"), Maybe.nothing(), "1athing_12345-xyz")
    console.log("test_variable_name done")
}
function test_main() {
    test_number()
    test_number_or_word()
    test_variable_name()
    console.log("all tests done")
}
if (typeof require !== 'undefined' && require.main === module) {
    test_main();
}
//@ignore_end
//@file_end