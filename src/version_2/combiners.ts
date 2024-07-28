import * as Maybe from "./maybe_v2"
import {
    Ast, 
} from "../ast_functions"
import * as AST from "../ast_functions"
import * as PM from "./parser_monad"

import {Parser, ParserResult, PReturnObj} from "./parser_monad"

import {removeLeadingWhitespace} from "./primitives"

// type ParserTupleAst = PP.PPair<Ast>
type P<T> = PM.Parser<T>
type PR<T> = PM.ParserResult<T>
type PRO<T> = PM.PReturnObj<T>
const makeJustParserResult = PM.makeJustParserResult
/**
 * This file provides two functions for combining parsers typically called "alternative" 
 * or "<|>" in haskell
 * 
 * and "sequence" which turns out in Haskell to be the applicative "<*>" operator
 * 
 * These combinators obviously cannot be implemented in typescript as a binary-infix operator.
 * 
 * In TS it makes more sense to implement them as a function acting on an Array of parsers.
 * 
 */
/** 
 * Alternative - try each parser in order, on the original input, and return the result of the first that succeeds
*/
// export function parser_orx(ps: Array<ParserAst>, input: string): ParserResultAst {
//     if(ps.length == 0) {
//         return make_failed()
//     }
//     const r = ps[0](input)
//     if(failed(r)) {
//         return parser_or_N(ps.slice(1), input)
//     }
//     return r
// }
export const choice = parser_or
export function parser_or<T,R>(p1: Parser<T>,  p2: Parser<R>): Parser<T|R> {
    return function(sinput: string): ParserResult<T|R> {
        const res1:PR<T> = p1(sinput)
        if(Maybe.isNothing(res1)) {
            const res2 = p2(sinput)
            if(Maybe.isNothing(res2))
                return Maybe.nothing()
            else {
                const {result:v2, remaining:r2}:PRO<T|R> = Maybe.getValue(res2)
                return makeJustParserResult((v2), r2)
            }
        }
        const {result:v1, remaining:r1}:PRO<T> = Maybe.getValue(res1)
        return makeJustParserResult((v1), r1)
    }
}
export const choiceN = parser_or_N
function parser_or_N(ps: Array<Parser<Ast>>, input: string): ParserResult<Ast> {
    if(ps.length == 0) {
        return Maybe.nothing()
    }
    const res1 = ps[0](input)
    if(Maybe.isNothing(res1)) {
        return parser_or_N(ps.slice(1), input)
    }
    const {result: r1, remaining: rem1} = Maybe.getValue(res1)
    return makeJustParserResult((r1), rem1)
}
export function followedBy3<R,S,T,U>(pr: Parser<R>, ps: Parser<S>, pt: Parser<T>, f:(r: R, s:S, t:T) => U):Parser<U> {
    // const ff = (x: R, y: S, z: T) => PM.eta(f(x,y,z))
    return PM.bindM3(pr, ps, pt, (x: R, y: S, z: T) => PM.eta(f(x,y,z)))
    // return function(sinput: string): ParserResult<U> {
    //     const res1 = pr(sinput)
    //     if(Maybe.isNothing(res1)) {
    //         return Maybe.nothing()
    //     }
    //     const {result: rv, remaining: rem1} = Maybe.getValue(res1)
    //     const res2 = ps(rem1)
    //     if(Maybe.isNothing(res2)) {
    //         return Maybe.nothing()
    //     }
    //     const {result: sv, remaining: rem2} = Maybe.getValue(res2)
    //     const res3 = pt(rem2)
    //     if(Maybe.isNothing(res3)) {
    //         return Maybe.nothing()
    //     }
    //     const {result: tv, remaining: rem3} = Maybe.getValue(res3)

    //     return makeJustParserResult(f(rv, sv, tv), rem3)
    // } 
}


// 
/**
 * 
 */
// export function alternativeOr<T>(p1: ParserType<T>, p2: ParserType<T>): ParserType<T[]> {
//     function run<T>(pp: Parser<T>, accum: ParserResult<T[]>, s: string ) {
//         const r = pp(s)
//         if(! Maybe.isNothing(r)) {
//             // const v = Maybe.get_value(r).value
//             // const accum_v = accum.value
//             // const new_accum_copy = accum_v.slice(0)
//             // const new_accum_v = new_accum_copy.concat([v])
//             // const accum_remaining = accum.remaining_input
//             // const ss = Maybe.get_value(r).value
//             // const accum2 = PP.make(new_accum_v, Maybe.get_value(r).remaining_input)
//             return PP.make(accum.value.concat([Maybe.get_value(r).value]) , Maybe.get_value(r).remaining_input)
//         } else {
//             return PP.make([], s)
//         }
//     }
//     function newparser<T>(s: string) {
//         let accum = PP.make([], s)
//         const accum1 = run(p1, accum, s) 
//         const accum2 = run(p2, accum1, accum1.remaining_input)
//         return accum2
//     }
//     return newparser
// }
// export function listOr<T>(ps: ParserType<T>[]): ParserType<T[]> {
//     function run<X extends T>(pp: ParserType<X>, accum: PP.PPair<X[]>, s: string ) {
//         const r = pp(s)
//         if(! Maybe.isNothing(r)) {
//             // const v = Maybe.get_value(r).value
//             // const accum_v = accum.value
//             // const new_accum_copy = accum_v.slice(0)
//             // const new_accum_v = new_accum_copy.concat([v])
//             // const accum_remaining = accum.remaining_input
//             // const ss = Maybe.get_value(r).value
//             // const accum2 = PP.make(new_accum_v, Maybe.get_value(r).remaining_input)
//             return PP.make(accum.value.concat([Maybe.get_value(r).value]) , Maybe.get_value(r).remaining_input)
//         } else {
//             return PP.make([], s)
//         }
//     }
//     function newparser<X extends T>(s: string) {
//         let accum = PP.make([] as T[], s)
//         while(ps.length > 0) {
//             const accum1 = run(ps[0], accum, s)
//             if(accum1.value.length == 0)
//                 break
//             ps = ps.slice(1) 
//             accum = accum1
//         }
//         return accum
//     }
//     return newparser
// }
// /**
//  * This applies the parse pp as often as possible without whitespace consumption.
//  * 
//  * Zero hits is considered success and in that case an empty X[] is returned
//  */
// export function manyOr<T>(pp: ParserType<T>): ParserType<T[]> {
//     function run<X extends T>(pp: ParserType<X>, accum: PP.PPair<X[]>, s: string ) {
//         const r = pp(s)
//         if(! Maybe.isNothing(r)) {
//             // const v = Maybe.get_value(r).value
//             // const accum_v = accum.value
//             // const new_accum_copy = accum_v.slice(0)
//             // const new_accum_v = new_accum_copy.concat([v])
//             // const accum_remaining = accum.remaining_input
//             // const ss = Maybe.get_value(r).value
//             // const accum2 = PP.make(new_accum_v, Maybe.get_value(r).remaining_input)
//             return PP.make(accum.value.concat([Maybe.get_value(r).value]) , Maybe.get_value(r).remaining_input)
//         } else {
//             return PP.make([], s)
//         }
//     }
//     function newparser<X extends T>(sinput: string) {
//         let s = sinput.slice(0)
//         let accum = PP.make([] as T[], s)
//         while(true) {
//             const accum1 = run(pp, accum, s)
//             if(accum1.value.length == 0)
//                 break
//             accum = accum1
//             s = accum.remaining_input
//         }
//         return accum
//     }
//     return newparser
// }

// /**
//  * This applies the parse pp as often as possible without whitespace consumption.
//  * 
//  * Zero hits is considered failure and in that case a Maybe.nothing() is returned
//  */
// export function someOr<T>(pp: ParserType<T>): ParserType<T[]> {
//     function newparser(s: string) {
//         const r = manyOr(pp)(s)
//         if(Maybe.isNothing(r)) {
//             throw new Error(`someOr - should never get here`)
//         }
//         const v = Maybe.get_value(r)
//         if(v.value.length > 0) {
//             return r
//         }
//         return Maybe.nothing()
//     }
//     return newparser
// }


// export function createOneOrMoreParser_new(singleChParser: PT.ParserType<string>) {
//     let accum: string[] = []
//     function manyTimes(sinput: string): Maybe.Maybe<PP.PPair<string>> {
//         let s = sinput.slice(0)
//         const combine = (s1: string) => (s2: string) => {
//             accum = accum.concat([s2]); 
//             return s1+s2
//         }
//         const r = APP.ap(APP.ap(APP.pure(combine), singleChParser), manyTimes)(s)
//         if(Maybe.isNothing(r)) {
//             if(accum.length == 0) {
//                 return Maybe.nothing()
//             } else {
//                 return PP.make(accum.join(""), Maybe.get_value(r).remaining_input)
//             }
//         }
//         return PP.make(accum.join(""), Maybe.get_value(r).remaining_input)
//     }
//     return manyTimes
// }

// /** Try each parser in order on the remainder string of the preceeding parser.
//  *  If any step fails stop and return failed without advancing the original string.
//  *  If all succeed then we have built an array of ParserTupleAst rather than ParserResultAst 
//  *  If all succeed apply the function (3rd arg) to the array of ParserResultAst
// */
// export function sequence(ps: Array<ParserAst>, sinput: string, combine:(rs:Array<ParserTupleAst>)=>ParserTupleAst): ParserResultAst {
//     let s = removeLeadingWhitespace(sinput)
//     let index = 0
//     let results: ParserTupleAst[] = []
//     while(index < ps.length) {
//         const parser = ps[index]
//         const r = parser(s)
//         if(failed(r)) {
//             return make_failed()
//         } else {
//             results.push(r as ParserTupleAst)
//             s = removeLeadingWhitespace(ast_remain(r))
//             index += 1
//         }
//     }
//     if(results.length != ps.length) {
//         throw new Error(`sequence successful result has wrong number of components`)
//     }
//     return Maybe.just(combine(results))
// }

// export function sequence2<T>(p1: P<T>, p2: P<T>, combine: (t1: T, t2: T) => T): P<T> {
//     const f = (t1: T) => (t2: T) => combine(t1, t2)
//     return APP.ap(APP.ap(APP.pure(f), p1), p2)
// }

// export function sequence3<T, S>(p1: P<T>, p2: P<S>, p3: P<T>, combine: (t1: T, t2: S, t3: T) => T): P<T> {
//     const f = (t1: T) => (t2: S) => (t3:T) => combine(t1, t2, t3)
//     return APP.ap(APP.ap(APP.ap(APP.pure(f), p1), p2), p3)

// }
// /**
//  * These sequence functions can also be implemented using the Monad structure as in
//  */
// export function sequenceMonadic2<T>(p1: P<T>, p2: P<T>, combine:(t1: T, t2: T) => P<T>) {
//     return PM.bindM2(p1, p2, combine)
// }

// export function sequenceMonadic3<T>(p1: P<T>, p2: P<T>, p3: P<T>, combine:(t1: T, t2: T, t3: T) => P<T>) {
//     return PM.bindM3(p1, p2, p3, combine)
// }
// /**
//  * Creates a new parser which
//  * -    Applies the argument `p` as many times as possible and returns success 
//  *      if at least one application is successful.
//  * -    The new parser T[] wrapped in PR.PResult where each element of the value array
//  *      is the T value from a single aplication of `p`
//  */
// export function many<T>(p: P<T>): P<T[]> {
//     function recurse(sinput: string): PP.PPair<Array<T>> {
//         const r = p(sinput)
//         if(Maybe.isNothing(r)) {
//             return PP.make([], sinput)
//         } else {
//             const rem = Maybe.get_value(r).remaining_input
//             const v = Maybe.get_value(r).value
//             const recurse_result = recurse(rem)
//             const rem2 = PP.get_remaining_input(recurse_result)
//             const recurse_value = PP.get_value(recurse_result)
//             const combined_value = [v].concat(recurse_value)
//             const y = PP.make(combined_value, rem2)
//             return y
//         }
//     }
//     return function (sinput: string): PR.PResult<T[]> {
//         const parse_result = recurse(sinput)
//         const v = 
        
//         PP.get_value(parse_result)
//         const rem = PP.get_remaining_input(parse_result)
//         if(v.length ==0) {
//             return PR.make_failed()
//         } else {
//             const ret = PR.make(v, rem)
//             return ret
//         }
//     }
// }

// // import * as SP from "./string_primitives"
// // function test_many() {
// //     function test_many_1() {
// //         const p = many(SP.parseSingleDigit)
// //         const rr = p("123tyu")
// //         console.log(rr)
// //         const rr2 = p("wjwjwj")
// //         console.log(rr2)
// //         const rr3 = PM.bind(p, (ar) => PM.eta(ar.join(":")))("19374JJJJ")

// //         console.log(rr3)
// //     }
// //     test_many_1()
// // }
// // test_many()