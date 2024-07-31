import {Ast} from "../ast_functions"
import * as PM from "../version_3/parser_monad"
import {ParserResult, Parser, makeJustParserResult, eta, bind} from "../version_3/parser_monad"

/**
 * Create a parser that recognizes a single character that satisfies a predicate
 */
export function createPredicateParser(predicate: (ch: string) => boolean): Parser<string> {
    return function(sinput: string){
        if((sinput.length == 0) || (! predicate(sinput.substring(0,1))))
            return null
        const value = sinput.substring(0,1)
        const remainder = sinput.slice(1)
        return makeJustParserResult(value, remainder)
    }
}

/**
 * choice and chocieN - combine 2 or more parsers by selecting the first one that succeeds
 */
export const choice = parser_or
export function parser_or<T,R>(p1: Parser<T>,  p2: Parser<R>): Parser<T|R> {
    return function(sinput: string): ParserResult<T|R> {
        const res1:ParserResult<T> = p1(sinput)
        if(null === res1) {
            const res2 = p2(sinput)
            if(null === res2)
                return null
            else {
                const [v2, r2] = res2
                return makeJustParserResult((v2), r2)
            }
        }
        const [v1, r1] = res1
        return makeJustParserResult((v1), r1)
    }
}
export const choiceN = parser_or_N
function parser_or_N(ps: Array<Parser<Ast>>, input: string): ParserResult<Ast> {
    if(ps.length == 0) {
        return null
    }
    const res1 = ps[0](input)
    if(null === res1) {
        return parser_or_N(ps.slice(1), input)
    }
    const [r1, rem1] = res1
    return makeJustParserResult((r1), rem1)
}

/**
 * Apply a single parser `zero or more times` or `one or more times``
 * 
 * This is interesting. The point of this parser is:
 * 
 * -    it only gets called when many1(single) fails
 * -    but `stopRecursionMarker` does not fail ever
 * -    what it does do is return a value that will stop the recursion in function `many1`
 * 
 * The reason for this is that if `many` actually failed the accumulation of the 
 * parsed bits if `T[]` would be lost
 */
function stopRecursionMarker<T>(sinput:string):ParserResult<T[]> {
    return PM.makeJustParserResult([], sinput)
}
/**
 * Note that an alternative definition of the `stopRecursionMarker` function is:
 */
const stopRecursionMarker2 = PM.eta([])

export function many<T>(single: Parser<T>): Parser<T[]> {
    return function(sinput: string): ParserResult<T[]> {
        const r = choice<T[], T[]>(many1(single), stopRecursionMarker2)(sinput)
        return r
    }
}
export function many1<T>(single: Parser<T>): Parser<T[]> {
    const ms: Parser<T[]> = many(single)
    return function(sinput: string)  { 
        const x = PM.bindM2<T, T[], T[]>(single, ms, (t:T, ts: T[]) => {
            const x2 = PM.eta([...[t], ...ts])
            return x2
        })(sinput)
        return x
    }
}

/**
 * specilaize `many` and `many` to string parsers
 */

export const create_OneOrMoreParser = create_OneOrMoreParser_3

/**
 * There are 3 versions of the following function as I developed the final solution in steps
 * and I did not want to loose the intermediate steps
 */

export function create_OneOrMoreParser_3(singleChParser: Parser<string>): Parser<string> {
    return bind(many1(singleChParser), (cs: string[]) => eta(cs.join("")))
}

export function create_OneOrMoreParser_2(singleChParser: Parser<string>): Parser<string> {
    const pp = many1(singleChParser)
    const ff = (cs: string[]) => eta(cs.join(""))
    const q = bind(pp, ff)

    return function(sinput: string): ParserResult<string> {
        const r = pp(sinput)
        if(null === r) {
            return null
        } else {
            const [cs, rem] = r
            return makeJustParserResult(cs.join(""), rem)
        }
    }
}
export function create_OneOrMoreParser_1(singleChParser: Parser<string>): Parser<string> {
    return function manyTimes(sinput: string): ParserResult<string> {
        let s = sinput.slice(0)
        const mr1 = singleChParser(s)
        let parse_result = ""
        if(null === mr1) {
            return null
        } else {
            // const pair = Maybe.get_value(r)
            const [first_digit_as_string, r1] = mr1
            // const remain = pair.remaining_input
            const mr2 = manyTimes(r1)
            if(null === mr2) {
                return makeJustParserResult(first_digit_as_string, r1)
            }
            // const result_pair = Maybe.get_value(r2)
            const [subsequent_digits_as_string, r2] = mr2
            // const subsequent_digits_as_string = Maybe.getValue(v2)
            const parse_result_string = first_digit_as_string  + subsequent_digits_as_string
            return makeJustParserResult(parse_result_string, r2) 
        }
    }
}

export const parseAdditionSign = whitespaceIfy(createPredicateParser((s) => (s === "+")))
export const parseMultiplySign = whitespaceIfy(createPredicateParser((s) => (s === "*")))
export const parseOpenBracket = whitespaceIfy(createPredicateParser((s) => (s === "(")))
export const parseCloseBracket = whitespaceIfy(createPredicateParser((s) => (s === ")")))

function isWhitespaceChar(ch: string) {return (ch.length > 0) && (ch.substring(0,1).match(/[\s]/g) !== null)}

export const removeLeadingWhitespace = stripLeadingWhitespace
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

export function whitespaceIfy<T>(p: Parser<T>): Parser<T> {
    return function(sinput: string): ParserResult<T> {
        return p(stripLeadingWhitespace(sinput))
    }
}

export function parseNumber(sinput: string): ParserResult<string> {
    const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g) !== null))
    const numParser = create_OneOrMoreParser(digitParser)
    const r = numParser(sinput)
    return r
}

/**
 * Now do sequences of dissimilar parsers
 */
export function followedBy<T, U>(p1: Parser<T>, p2: Parser<U>): Parser<[T,U]> {
    return PM.bindM2(p1, p2, (t:T, u:U) => PM.eta([t, u]))
}

export function followedBy3<R,S,T,U>(pr: Parser<R>, ps: Parser<S>, pt: Parser<T>, f:(r: R, s:S, t:T) => U):Parser<U> {
    return PM.bind(pr, (r:R) => PM.bind(ps, (s:S) => PM.bind(pt, (t:T) => PM.eta(f(r,s,t)))))
    // which is the same as
    // return PM.bindM3(pr, ps, pt, (x: R, y: S, z: T) => PM.eta(f(x,y,z)))
}
