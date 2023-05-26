import { ParseError } from "got/dist/source"
import * as Maybe from "../src/maybe"
import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"

/**
 * # A Simple Parsing Exercise
 * 
 * Below is a worked example of a simple parsing exercise. 
 * 
 * The goal is to write a function that will parse and evaluate expressions of the form ` 325 +7684`.
 * 
 * That is a `number` `plus sign` `number`.
 * 
 * Along the way I want this example to demonstrate:
 * 
 * - how our definition of a `Parser` actually works in practice
 * - why our definition of a Parser and its return value Maybe.Maybe<PP.PPair<T>> are generic 
 * by using two diffrrerent types for T in this example.
 * - demonstrate how parsers can be built up from simple parsers,
 * -    by having functions that construct parsers, and 
 * -    start to explore how parsers can be combined (sequence, alternative, many) to produce new parsers.    
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
 * The ubiquity of this pattern is one of the motivations for the Categorical machinery (Monads,  `bind`,
 * Applicative etc) found in Haskell programming.
 * 
 * The next version of this current exercise to be found in in files `src/string_primitives.ts` and
 * `tests/string_primitives.ts` demonstrates these same functions using some Categorical machinery.
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
 * many of the files in `src/` abreviate the above definition to `type P<T> = ParserType<T>
 * 
 * ## ParserPair - the file src/parser_pair.ts
 * 
 * This is just an implementation of a pair [T, string] with some better properties than a direct use of a typescript tuple.
 * 
 * ## ParserResult - the file src/parser_result.ts
 * 
 * In retrospect I am not sure that the type `PResult<T>` adds much to ones understanding of this whole project
 * and at some future update I might remove it.
 * 
 * You will note that in this file it is an unused import.
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
function parseSingleDigit(sinput: string): Maybe.Maybe<PP.PPair<string>> {
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
function createPredicateParser(predicate: (ch: string) => boolean): PT.ParserType<string> {
    return (sinput: string) => {
        if((sinput.length == 0) || (! predicate(sinput.substring(0,1))))
            return Maybe.nothing()
        const value = sinput.substring(0,1)
        const remainder = sinput.slice(1)
        return Maybe.just(PP.make(value, remainder))
    }
}
/**
 * Take a parser for a single character meeting some criteria and return
 * a parser that detects one or consecutive instances of such characters.
 * 
 *  
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
const removewhitespace = (sinput: string): string => {
    const s = sinput.slice(0)
    const r = createOneOrMoreParser(createPredicateParser((ss) => ss.substring(0,1) == " ") )(s)
    if(Maybe.isNothing(r)) {
        return s
    }
    return removewhitespace(Maybe.get_value(r).remaining_input)
}

function parseNumber(sinput: string): Maybe.Maybe<PP.PPair<number>> {
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

function parsePlusSign(sinput: string): Maybe.Maybe<PP.PPair<string>> {
    const plus = createPredicateParser((ss: string) => ss.substring(0,1) == "+")
    const s = removewhitespace(sinput)
    return plus(s)
}

function parseSum(sinput: string): Maybe.Maybe<PP.PPair<number>> {
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
function format_result<T>(r: Maybe.Maybe<PP.PPair<T>>): string {
    if(Maybe.isNothing(r)) {
        return "NOTHING"
    }
    return `the result is [value: ${Maybe.get_value(r).value} remaining_input: "${Maybe.get_value(r).remaining_input}"]`
}



function test_parse_sum() {
    const r1 = format_result(parseSum("2 + 7"))
    console.log(`test_parse_sum 01 ${r1}`)
}
export function test_string_primitives() {
    test_parse_sum()
}
