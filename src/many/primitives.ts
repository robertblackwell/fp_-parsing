import * as STM from "./strings_and_things_monad"

import {ParserResult, Parser, makeJustParserResult, bindM2, choice} from "./strings_and_things_monad"

export function createPredicateParser(predicate: (ch: string) => boolean): Parser<string> {
    return function(sinput: string): ParserResult<string>{
        if((sinput.length == 0) || (! predicate(sinput.substring(0,1))))
            return []
        const value = sinput.substring(0,1)
        const remainder = sinput.slice(1)
        const rr: ParserResult<string> = [[value, remainder]]
        return rr
    }
}
/**
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
    return [[[], sinput]]
}
/**
 * Note that an alternative definition of the `stopRecursionMarker` function is:
 */
const stopRecursionMarker2 = STM.eta([])

export function many<T>(single: Parser<T>): Parser<T[]> {
    return function(sinput: string): ParserResult<T[]> {
        const r = choice<T[]>(many1(single), stopRecursionMarker2)(sinput)
        return r
    }
}
export function many1<T>(single: Parser<T>): Parser<T[]> {
    const ms: Parser<T[]> = many(single)
    return function(sinput: string)  { 
        const x = bindM2<T, T[], T[]>(single, ms, (t:T, ts: T[]) => {
            const x2 = STM.eta([...[t], ...ts])
            return x2
        })(sinput)
        return x
    }
}

export function create_OneOrMoreParser(singleChParser: Parser<string>): Parser<string[]> {
    return function manyTimes(sinput: string): ParserResult<string[]> {
        let s = sinput.slice(0)
        const mr1: [string, string][] = singleChParser(s)
        let parse_result = ""
        if(mr1.length === 0) {
            return []
        } else {
            // const pair = Maybe.get_value(r)
            const [ch, rem1] = mr1[0]
            // const remain = pair.remaining_input
            const mr2 = manyTimes(rem1)
            if(mr2.length === 0) {
                return [[[ch], rem1]]
            }
            // const result_pair = Maybe.get_value(r2)
            const [chs, rem2] = mr2[0]
            // const subsequent_digits_as_string = Maybe.getValue(v2)
            const parse_result_string: [string[], string][] = [[[...[ch], ...chs], rem2]]
            return parse_result_string
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

export function parseNumber(sinput: string): ParserResult<string[]> {
    const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g) !== null))
    const numParser = create_OneOrMoreParser(digitParser)
    const r = numParser(sinput)
    return r
}

// export function followedBy<T, U>(p1: Parser<T>, p2: Parser<U>): Parser<[T,U]> {
//     function f(t:T, u:U): Parser<[T,U]> {
//         return PM.eta([t,u])
//     }
//     const x = PM.bindM2(p1, p2, f)
//     return function(sinput: string) {
//         const res1 = p1(sinput)
//         if(Maybe.isNothing(res1)) {
//             return Maybe.nothing()
//         }
//         const {result: v1, remaining: rem1}: PReturnObj<T> = Maybe.getValue(res1)
//         const res2 = p2(rem1)
//         if(Maybe.isNothing(res2)) {
//             return Maybe.nothing()
//         }
//         const {result: v2, remaining: rem2}: PReturnObj<U> = Maybe.getValue(res2)
//         return makeJustParserResult([v1, v2], rem2)
//     }
// }
// export function followedBy3<R,S,T,U>(pr: Parser<R>, ps: Parser<S>, pt: Parser<T>, f:(r: R, s:S, t:T) => U):Parser<U> {
//     const x = PM.bindM3(pr, ps, pt, (r:R, s:S, t:T) => PM.eta(f(r,s,t)))
//     return function(sinput: string): ParserResult<U> {
//         const res1 = pr(sinput)
//         if(Maybe.isNothing(res1)) {
//             return Maybe.nothing<PReturnObj<U>>()
//         }
//         const {result: rv, remaining: rem1} = Maybe.getValue<PReturnObj<R>>(res1)
//         const res2 = ps(rem1)
//         if(Maybe.isNothing(res2)) {
//             return Maybe.nothing()
//         }
//         const {result: sv, remaining: rem2} = Maybe.getValue<PReturnObj<S>>(res2)
//         const res3 = pt(rem2)
//         if(Maybe.isNothing(res3)) {
//             return Maybe.nothing()
//         }
//         const {result: tv, remaining: rem3} = Maybe.getValue<PReturnObj<T>>(res3)

//         return makeJustParserResult(f(rv, sv, tv), rem3)
//     } 
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// type StringParser = 
// function makePredicateParser(pred: (ch: string) => boolean): StringParser {
//     return function(sinput: string):  
// }
/**
 * This is the same as the makeCharAstParser but the result is PR.PResult<string> 
 * and hence can be applied to any string regardless of the nature of the Ast
 */
// export function makeCharStringParser(ch: string): Parser<string> {
//     if(ch.length != 1) {
//         throw new Error(`makeCharParser ch is too long ${ch}`)
//     }
//     return function(s: string): ParserResult<string> {
//         let s2 = removeLeadingWhitespace(s)
//         if(s2.substring(0, 1) == ch) {
//             const remstr = removeLeadingWhitespace(s2.slice(1))
//             return PR.make(ch, remstr)
//         }
//         return PR.make_failed()        
//     }
// }


// /**
//  * Make a parser that looks for a ch and produces an Ast 
//  * NOTE: The repertoire of such parsers is restricted by 
//  * the definition of Ast/Tree.TreeNode and what chars/strings can be used 
//  * to make Ast instances.
//  * numbers 
// */
// export function makeCharAstParser(ch: string): ParserAst {
//     if(ch.length != 1) {
//         throw new Error(`makeCharParser ch is too long ${ch}`)
//     }
//     return function(s: string): ParserResultAst {
//         let s2 = removeLeadingWhitespace(s)
//         if(s2.substring(0, 1) == ch) {
//             const ast = Tree.CharNode.make(ch) as Tree.TreeNode as Ast
//             const remstr = removeLeadingWhitespace(s2.slice(1))
//             return AST.make_result(ast, remstr)
//         }
//         return AST.make_failed()        
//     }
// }
// // export function parsePlusSignToAst(s: string): ParserResultAst {
//     const f = makeCharAstParser("+")
//     return f(s)
// }
// export function parseAdditionSignToAst(sinput: string): ParserResultAst {
//     const s = removeLeadingWhitespace(sinput)
//     const f = makeCharAstParser("+")
//     return f(s)
// }
// export function parseMultSignToAst(s: string): ParserResultAst {
//     const f = makeCharAstParser("*")
//     return f(s)
// }
// export function parseMultiplySignToAst(sinput: string): ParserResultAst {
//     const s = removeLeadingWhitespace(sinput)
//     const f = makeCharAstParser("*")
//     return f(s)
// }
// export function parseOpenBracket(sinput: string): ParserResultAst {
//     const s = removeLeadingWhitespace(sinput)
//     const f = makeCharAstParser("(")
//     return f(s)
// }
// export function parseCloseBracket(sinput: string): ParserResultAst {
//     const s = removeLeadingWhitespace(sinput)
//     const f = makeCharAstParser(")")
//     return f(s)
// }
// export function removeLeadingWhitespace(s: string): string {
//     if((s.length > 0) && (s.substring(0, 1) == " ")) {
//         return removeLeadingWhitespace(s.slice(1))
//     }
//     return s.slice(0)
// }
// export function parseNumberToAst(sinput: string): ParserResultAst {
//     const f = (n: number) => (PM.eta(Tree.NumberNode.make(n) as Ast))
//     const r = PM.bind(parseNumber, f)
//     return r(sinput)
// }
