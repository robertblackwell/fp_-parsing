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
function parseAnyChar<string>(sinput: string): {maybe_result: Maybe<string>, remaining: string} {
    const s = removewhitespace(sinput)
    if(sinput.length ==0)
        return {maybe_result: Maybe.nothing(), remaining: sinput}
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return {maybe_result: Maybe.just(value), remaining: remainder}
}
```
This can trivially be modified to provide a parse that can successfully parse any 
single digit. Note we have not consumed leading whitespace.
```ts
/**
 * Parse a digit without consuming leading white space
 */ 
function parseSingleDigit(sinput string): {maybe_result: Maybe<string>, remaining: string} {
    const s = sinput.slice(0)
    if((s.length == 0) || (s.substring(0, 1).match(/[0-9]/g) == null) {
        return makeParserResult(Maybe.nothing(), remaining)
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
function createPredicateParser(predicate (ch: string) => boolean): Parser<string> {
    return function(s: string){
        if((sinput.length == 0) || (! predicate(s.substring(0,1))))
            return {maybe_result: Maybe.nothing(), remaining: sinput}
        const value = s.substring(0,1)
        const remainder = s.slice(1)
        return {maybe_result: Maybe.just(value), remaining: remainder}
    }
}
```

As the final example of this section we will make a parser that successfully parser
a single whitespace character;

```ts
const oneWhitespaceCharacterParser = createPredicateParser((ss) => ss.substring(0,1).match(/[\s]/g) )
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
```
The experienced Haskel programmer will observe that the `create_OneOrMoreParser()` could have
used more of the `Monad` properties of the `Maybe Monad`. We will come back to that eventually.

The one-or-more constructor makes parsing numbers (a string consisting only of digits) easy. As below.
```ts
function parseNumber(sinput: string): Maybe<PPairClass<string>> {
    const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g)))
    const numParser = create_OneOrMoreParser(digitParser)
    return numParser(s)
}
```

As a second example of the use of the `create_OneOrMoreParser()` lets make a parser that can successfully parse
uppercase words (sequences of upper case letters).

```ts
function parseUppercaseWords(sinput: string): Maybe<PPairClass<string>> {
    const upperCaseLetterParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[A-Z]/g)))
    const upperCaseWordParser = create_OneOrMoreParser(upperCaseLetterParser)
    return upperCaseWordParser(s)
}
```

## Whitespace 

The following strings `2 + 3* (4 +   1)` and `2+3*(4+1)` are equivalent as arithmetic expressions
because whitespace between the terms does not change the interpretation of the expression.  

Thus we have a decision to make. When we parse expressions do we keep track of the white space
so that the exact input string can be recreated froom the `Ast` (such as string 1 above),
do we use eliminate whitespace during the parsing process like in string 2 above, or
maybe reduce each sequence of whitespace to a single `space character` like `2 + 3 * ( 4 + 1 )`.

We will chose to eliminate whitespace.

Before continuing lets make a function that parses a sequence of whitespace.

```ts
const whitespaceParser = create_OneOrMoreParser(oneWhitespaceCharParser) 
```

Hence many of the parser function we design will be required to eliminate all whitespace from the front
of their input string before attempting to parse an input string. 

Consider a parser `const p: (sinput: string) => Maybe<PP<T>>`.

Here is a function that converts that parser `p` to a new parser that strips whitespace from the front of the input
string.

```ts
function whitespaceIfy(p  (sinput: string) => Maybe<PP<T>>) (sinput: string) => Maybe<PP<T>> {
    return function(sinput: string): Maybe<PP<T>> {
        const r = whitespaceParser(sinput)
        const sin = (Maybe.isNothing(r)) ? sinput: Maybe.get_remainder(r)
        return p(sin)
    }
}

```


## Alternatives or - the OR parser

Consider that task of parsing strings which are either 

-   numbers, a sequence of digits
-   capitalized words, a sequence of uppercase letters

This can be achieved by:

-   first applying `parseNumber()` and if successfull its return value is the return value of our desired parser.
-   if `parseNumber()` fails then apply `parseUppercaseWords()` and use its return value.

In code this looks like:

```ts
function parseNumberOrUppercaseWord(sinput string): Maybe<PPairClass<string>> {
    const r1 = parserNumber(sinput)
    if(Maybe.isNothing(r1)) {
        const r2 = parseUppercaseWord(sinput)
        if(Maybe.isNothing(r2))
            return Maybe.nothing<string>()
        const numb = r2.get_value()
        return Maybe.just<string>(numb))
    }
    const s string = r1.get_value()
    return Maybe.just<string>(s)
}
```

Infact this is a general construct. Given two parsers:

-   `const p1: (s string) => Maybe<PPairClass<T>>`
-   `const p2: (s string) => Maybe<PPairClass<R>>`

We can get a `p1_OR_p2` parser as follows:

```ts
function OR_parser(p1 (s string) => Maybe<PPairClass<T>>,  p2 (s string) => Maybe<PPairClass<R>>): (s string) => Maybe<PPairClass<T|R>> {
    return function(sinput string): Maybe<PPairCase<T|R>> {
        const r1 = parserNumber(sinput)
        if(Maybe.isNothing(r1)) {
            const r2 = parseUppercaseWord(sinput)
            if(Maybe.isNothing(r2))
                return Maybe.nothing<T|R>()
            const v2 R = r2.get_value()
            return Maybe.just<T|R>(v2))
        }
        const tvalue T = r1.get_value()
        return Maybe.just<T|R>(s)
    }
}
```

## The Followed-By Parser

Lets make a function that will parser variable names. Variable names:

-   must start with an upper or lower case letter or an underscore `_`
-   thereafter there may be zero of more characters that are either

    - digits, uppercase letters, lowercase letters or underscores.

Its pretty clear that we can do this by first parsing the initial character with

```ts
const firstCharParser = createPredicateParser((s) => (s.substring(0, 1).match(/[a-zA-Z_]/g)) )
```
and then parsing all of the remaining characters with:

```ts

const subsequentCharParser = create_OneOrMoreParser(createPredicateParser((s) => (s.substring(0, 1).match(/[a-zA-Z_]/g))))

```

So now lets turn our attention to creating a function that combines `firstCharParser` and `sunsequentCharParser` 
as described above.

```ts
function variableNameParser(sinput: string): Maybe<PP<string>> {
    const r1 = firstCharParser(sinput)
    if(Maybe.isNothing(r1)) {
        return r1
    }
    return subsequentCharParser(Maybe.get_value(r1))
}

```

Again this can be generalized as:

```ts
function followedBy(p1: (sinput: string)=>Maybe<PP<T>>, p2:(sinput: string) => Maybe<PP<T>>): (sinput: string) => Maybe<PP<T>> {
    const r1 = p1(sinput)
    if(Maybe.isNothing(r1)) {
        return r1
    }
    return p2(Maybe.get_value(r1))
}

```

Remembering that `Parser<T> = (sinput: string) => Maybe<PP<T>>` we can generalize `followedBy` from a binary operation to an
array operation. Such that a list of parsers can be applied one after the other.

```ts
/**
 * You might recongnize this as a left_fold operation
 */ 
function sequence(ps: Array<Parser<T>>): Parser<T> {
    let p_accum = ps[0]
    ps[1:].foreach((pnext) => {
        p_accum = followedBy(p_accum, pnext)
    })
}

```