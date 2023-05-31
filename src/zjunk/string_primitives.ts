import { ParseError } from "got/dist/source"
import * as Maybe from "../src/maybe"
import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as APP from "../src/parser_applicative"

/**
 * # A Simple Parsing Exercise
 * Below is a worked example of a simple parsing exercise. 
 * 
 * The goal is to write a function that will parse and evaluate expressions of the form ` 3 +7`.
 * That is a `number` `plus sign` `number`.
 * 
 * Along the way I want this example to demonstrate:
 * 
 * - how our definition of a `Parser` actually works in practice
 * - why our definition of a Parser and its return value Maybe.Maybe<PP.PPair<T>> are generic 
 * by using two diffrrerent types for T in this example.
 * - demonstrate how parsers can be built up by having functions that construct parsers 
 * and how parsers can be "composed" in sequence.    
 * 
 * ## Observation
 * 
 * Note that a code pattern of the form 
 * ```ts
 *  const r = parse_????(s)
 *  if(Maybe.isNothing(r)) {
 *      return maybe.nothing()
 *  }
 *  const pair = Maybe.get_value(r)
 *  const v = pair.value
 *  const remain = pair.remaining_input
 *  ... 
 * ```
 * Is seen in almost every function in this example. 
 * 
 * This pattern is at the core of the  Monad `bind` or `>>=`, or the applicative operator for the `Maybe` monad.
 * 
 * Example 2 in file `paper/example_02.ts` demonstrates these same functions using `bind`
 * 
 *  
 * ## Prerequisites
 * Before trying to dig into this example you should probably go look at some of the 
 * import files so that the notation/constructs below are a little familiar.
 * 
 * ## Maybe - the file `src/maybe.ts` 
 * 
 * You dont need to understand all the category theory stuff in `src/maybe.ts` at this point.
 * Just ensure you are comfortable with:
 * -    Maybe.Maybe - its a Generic type constructor
 * -    Maybe.nothing()
 * -    Maybe.just()
 * 
 * ## ParserType - the file src/parser_type.ts
 * 
 * You may well look at the single statement in this file and go "what!". 
 * 
 * It translates to `type ParserType<T> = (s: string) => Maybe.Maybe<PP.PPair<T>>`
 * 
 * which leads to.
 * ## ParserPair - the file src/parser_pair.ts
 * 
 * This is just an implementation of a pair [T, string] with some better properties that a direct use of a typescript tuple.
 * 
 * ## ParserResult - the file src/parser_result.ts
 * 
 * In retrospect I am not sure that the type `PResult<T>` adds much to ones understanding of this whole project
 * and at some future update I might remove it.
 * 
 * You will note that in this file it is an unused import.
 * 
 */
/**
 * Match any single character
 */
function parseAnyChar(sinput: string): Maybe.Maybe<PP.PPair<string>> {
    const s = sinput.slice(0)
    if(sinput.length ==0)
        return Maybe.nothing()
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return Maybe.just(PP.make(value, remainder))
}
/**
 * Parse a digit if without consuming leading white space
 */ 
export function parseSingleDigit(sinput: string): Maybe.Maybe<PP.PPair<string>> {
    const s = sinput.slice(0)
    if((s.length == 0) || (s.substring(0, 1).match(/[0-9]/g)) == null) {
        return Maybe.nothing()
    }
    const value = s.substring(0,1)
    const remainder = s.slice(1)
    return Maybe.just(PP.make(value, remainder))
}
/**
 * Return a parser that parses the next single character in the input if it satisfies 
 * a predicate
 */
export function createPredicateParser(predicate: (ch: string) => boolean): PT.ParserType<string> {
    return (sinput: string) => {
        if((sinput.length == 0) || (! predicate(sinput.substring(0,1))))
            return Maybe.nothing()
        const value = sinput.substring(0,1)
        const remainder = sinput.slice(1)
        return Maybe.just(PP.make(value, remainder))
    }
}
export function createPredicateParserStripLeadingWhiteSpace(predicate: (ch: string) => boolean): PT.ParserType<string> {
    return function (sinput: string) {
        const newinput = removewhitespace(sinput)
        return createPredicateParser(predicate)(newinput)
    }
}
const removewhitespace = (sinput: string): string => {
    const s = sinput.slice(0)
    const r = createOneOrMoreParser(createPredicateParser((ss) => ss.substring(0,1) == " ") )(s)
    if(Maybe.isNothing(r)) {
        return s
    }
    return removewhitespace(Maybe.get_value(r).remaining_input)
}

export const parseNumber = parseNumber_old
function parseNumber_old(sinput: string): Maybe.Maybe<PP.PPair<number>> {
    const digitParser = createPredicateParser((ss: string) => ((ss.substring(0, 1).match(/[0-9]/g) != null)))
    const numParser = createOneOrMoreParser(digitParser)
    let s = removewhitespace(sinput)
    const maybe_numstr = numParser(s)
    if(Maybe.isNothing(maybe_numstr)) {
        return Maybe.nothing()
    }
    const pair = Maybe.get_value(maybe_numstr)
    const num = parseInt(pair.value)
    if(isNaN(num)) {
        throw new Error("something went wrong - should not get here")
    }
    return Maybe.just(PP.make(num, pair.remaining_input))
}

function parseNumber_new(sinput: string): Maybe.Maybe<PP.PPair<number>> {
    const digitParser = createPredicateParser((ss: string) => ((ss.substring(0, 1).match(/[0-9]/g) != null)))
    const parseNumberString = createOneOrMoreParser(digitParser)
    const numStrToNumber = (ns: string) => {
        const num = parseInt(ns)
        if(isNaN(num))
            throw new Error("something went wrong - should not get here")
        else
            return num //Maybe.just(PP.make(num, pair.remaining_input))
    }
    let s = removewhitespace(sinput)
    return APP.ap(APP.pure(numStrToNumber), parseNumberString)(sinput)
}


export const parsePlusSignToString = createPredicateParserStripLeadingWhiteSpace((ch: string) => (ch === "+"))
export const parseMultSignToString = createPredicateParserStripLeadingWhiteSpace((ch: string) => (ch === "*"))
export const parseOpenBracketToString = createPredicateParserStripLeadingWhiteSpace((ch: string) => (ch === "("))
export const parseCloseBracketToString = createPredicateParserStripLeadingWhiteSpace((ch: string) => (ch === ")"))

function parsePlusSign(sinput: string): Maybe.Maybe<PP.PPair<string>> {
    const plus = createPredicateParser((ss: string) => ss.substring(0,1) == "+")
    const s = removewhitespace(sinput)
    return plus(s)
}
function parseSum_old(sinput: string): Maybe.Maybe<PP.PPair<number>> {
    const s = removewhitespace(sinput)
    const r1 = parseNumber(s)
    if(Maybe.isNothing(r1)) {
        return Maybe.nothing()
    }
    const num_first = Maybe.get_value(r1).value
    const r2 = parsePlusSign(Maybe.get_value(r1).remaining_input)
    if(Maybe.isNothing(r2)) {
        return Maybe.nothing()
    }
    const r3 = parseNumber(Maybe.get_value(r2).remaining_input)
    if(Maybe.isNothing(r3)) {
        return Maybe.nothing()
    }
    return r3
}
export function parseSum(sinput: string): Maybe.Maybe<PP.PPair<number>> {
    const s = removewhitespace(sinput)
    const r1 = parseNumber(s)
    function combine(n1: number, plus: string, n2: number): number {return n1 + n2}
    const curried_combine = ((n1: number) => (s: string) => (n2: number) => n1 + n2)
    const pure_curried_combine = APP.pure(curried_combine)
    const pp =  APP.ap(APP.ap(APP.ap(pure_curried_combine, parseNumber), parsePlusSign), parseNumber)
    const x = pp(sinput)
    return x
}

/**
 * Take a parser for a single character meeting some criteria and return
 * a parser that detects one or consecutive instances of such characters 
 * 
 * This implmentation is parser specific. A more general solution is possible
 * but it requires an examination of a Functor of type Alternative
 * and there is already enough category theory in this project
*/
function createOneOrMoreParser(singleChParser: PT.ParserType<string>) {
    function manyTimes(sinput: string): Maybe.Maybe<PP.PPair<string>> {
        let s = sinput.slice(0)
        const r = singleChParser(s)
        let parse_result = ""
        if(Maybe.isNothing(r)) {
            return Maybe.nothing()
        }
        const pair = Maybe.get_value(r)
        parse_result = pair.value
        const remain = pair.remaining_input
        const r2 = manyTimes(remain)
        if(Maybe.isNothing(r2)) {
            return Maybe.just(PP.make(parse_result, remain)) 
        }
        const pair2 = Maybe.get_value(r2)
        parse_result = parse_result + pair2.value
        return Maybe.just(PP.make(parse_result, pair2.remaining_input)) 
    }
    return manyTimes
}

export function whitespace(sinput: string): string {
    let s= sinput.slice(0)
    while((s.length > 0)&&(s.substring(0,1) == " ")) {
        s = s.slice(1)
    }
    return s
}
export function make_parser_regex(regex: RegExp): PT.P<string> {
    return function alphas(sinput: string): PR.PResult<string> {
        let s = whitespace(sinput)
        // const regex = /[A-Za-z]/g
        let result = ""
        while((s.length > 0) && (s.substring(0,1).match(regex))) {
            result = `${result}${s.substring(0,1)}`
            s = s.slice(1)
        }
        if(result != "") {
            return PP.make(result, s)
        } else {
            return Maybe.nothing()
        }
    }
}
export const alphas = make_parser_regex(/[A-Za-z]/g)
export const numeric = make_parser_regex(/[0-9]/g)


// function createOneOrMoreParser_new(singleChParser: PT.ParserType<string>) {
//     // throw new Error(`createOneOrMoreParser_new does not work - dont callit`)
//     function manyTimes(sinput: string): Maybe.Maybe<PP.PPair<string>> {
//         let s = sinput.slice(0)
//         const combine = (s1: string) => (s2: string) => s1+s2
//         const x = APP.ap(APP.ap(APP.pure(combine), singleChParser), manyTimes)(s)
//         return x
//    }
//     return manyTimes
// }


/**
 * Of course the implementation of parseSum2 could be made more brief as follows:
 * ```ts
 * function parseSum2(sinput: string): Maybe.Maybe<PP.PPair<number>> {
 *  const s = removewhitespace(sinput)
 *  const r1 = parseNumber(s)
 *  const pp =  APP.ap(APP.ap(APP.ap(pure((n1: number) => (s: string) => (n2: number) => n1 + n2), parseNumber), parsePlusSign), parseNumber)
 *  const x = pp(sinput)
 *  return x
}

 * ``` 
 */
export function format_result<T>(r: Maybe.Maybe<PP.PPair<T>>): string {
    if(Maybe.isNothing(r)) {
        return "NOTHING"
    }
    return `the result is [value: ${Maybe.get_value(r).value} remaining_input: "${Maybe.get_value(r).remaining_input}"]`
}

export function test_parse_sum() {
    const r1 = format_result(parseSum("2453 + 2557"))
    console.log(`test_parse_sum 01 ${r1}`)
}
export function test_createoneormore() {
    const digitParser = createPredicateParser((ss: string) => ((ss.substring(0, 1).match(/[0-9]/g) != null)))
    const r = createOneOrMoreParser(digitParser)("123r")
    console.log(r)
}


export function test_oneormore_parser() {
    const test_input = "1234hhhh"

    const p = createOneOrMoreParser(parseSingleDigit) 
    const r = p(test_input)
    const p2 = createOneOrMoreParser(parseSingleDigit)
    const r2 = p2(test_input)
    console.log(r)
}

// test_oneormore_parser()
// test_parse_sum()
