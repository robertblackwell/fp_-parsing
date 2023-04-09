import * as Maybe from "./maybe"
import {
    Ast, 
    ParserTupleAst, ParserResultAst, ParserAst,
    failed,
    make_result, make_failed, 
    ast_remain, ast_value} from "./ast_functions"
import * as AST from "./ast_functions"
import * as PT from "./parser_pair"
import * as PR from "./parser_result"
import {ParserType} from "./parser_type"
import {removeLeadingWhitespace} from "./primitives"

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
export function parser_or(ps: Array<ParserAst>, input: string): ParserResultAst {
    if(ps.length == 0) {
        return make_failed()
    }
    const r = ps[0](input)
    if(failed(r)) {
        return parser_or(ps.slice(1), input)
    }
    return r
}

/** Try each parser in order on the remainder string of the preceeding parser.
 *  If any step fails stop and return failed without advancing the original string.
 *  If all succeed then we have built an array of ParserTupleAst rather than ParserResultAst 
 *  If all succeed apply the function (3rd arg) to the array of ParserResultAst
*/
export function sequence(ps: Array<ParserAst>, sinput: string, combine:(rs:Array<ParserTupleAst>)=>ParserTupleAst): ParserResultAst {
    let s = removeLeadingWhitespace(sinput)
    let index = 0
    let results = []
    while(index < ps.length) {
        const parser = ps[index]
        const r = parser(s)
        if(failed(r)) {
            return make_failed()
        }
        results.push(r as ParserTupleAst)
        s = removeLeadingWhitespace(ast_remain(r))
        index += 1
    }
    if(results.length != ps.length) {
        throw new Error(`sequence successful result has wrong number of components`)
    }
    return Maybe.just(combine(results))
}
