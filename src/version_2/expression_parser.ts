import * as Tree from "../tree"
import * as AST from "../ast_functions"
import {
    Parser, ParserResult, PReturnObj, makeJustParserResult, bindM3, bindM2, bind, eta
} from "./parser_monad"

import * as Maybe from "./maybe_v2"

import {
    stripLeadingWhitespace,
    parseNumber,
    parseMultiplySign,
    parseAdditionSign,
    parseOpenBracket, 
    parseCloseBracket} from "./primitives"

import {choice, choiceN, followedBy3} from "./combiners"

const removeLeadingWhitespace = stripLeadingWhitespace

type Ast = AST.Ast
type TNode = Tree.TreeNode
/**
 * This file contains the parsers/functions that parser an aritmetic expression.
 * And only those functions as all support functions are imported.
 * 
 * The bnf definition of the parsing operation is 
 * 
 *      exp  ::= term + exp | term
 *      term ::= factor * term | factor
 *      factor :: = number | (exp)
 *
 * This structure is copied in the following parsers/function.
 */
/**
 * parse an expression
 * - first try 
 *      exp ::= term + exp
 * - if that fails try 
 *      term
*/

/*********************************************************************************** */
export function expression(sinput: string): ParserResult<Ast> {
    return choiceN([term_plus_expression_1, term_only], removeLeadingWhitespace(sinput))
}
export function term_plus_expression_1(sinput: string): ParserResult<TNode> {
    return followedBy3(term, parseAdditionSign, expression, (x:TNode, y:string, z:TNode) => Tree.AddNode.make(x,z))(removeLeadingWhitespace(sinput))
    // const s  = removeLeadingWhitespace(sinput)
    // const res1 = term(s)
    // if(Maybe.isNothing(res1)) {
    //     return Maybe.nothing()
    // }
    // const {result: r1, remaining: rem1}: PReturnObj<Ast>  = Maybe.getValue(res1)
    // const res2 = parseAdditionSign(rem1)
    // if(Maybe.isNothing(res2)) {
    //     return Maybe.nothing()
    // }
    // const {result: r2, remaining: rem2}: PReturnObj<string>  = Maybe.getValue(res2)
    // let res3 = expression(rem2)
    // if(Maybe.isNothing(res3)) {
    //     return Maybe.nothing()
    // }
    // let {result: r3, remaining: rem3}: PReturnObj<Ast> = Maybe.getValue(res3)
    // if(r1 === null || r3 === null) {
    //     throw Error("") ///@todo - fix this
    // }
    // let newast = Tree.AddNode.make(r1, r3)
    // return makeJustParserResult(newast, rem3)
}
// export function term_plus_expression_2(sinput: string): ParserResult<TNode> {
//     function add(left: TNode, op: string,  right: TNode): TNode {
//         let newast = Tree.AddNode.make(left, right)
//         return newast
//     } 
//     return followedBy3(term, parseAdditionSign, expression, add)(sinput)
// }
export function term_only(sinput: string): ParserResult<TNode> {
    return bind(term, (x: TNode) => eta (x))(removeLeadingWhitespace(sinput))
    // const s = removeLeadingWhitespace(sinput)
    // const res1 = term(s)
    // if(Maybe.isNothing(res1)) {
    //     return Maybe.nothing()
    // }
    // const {result: r, remaining: rem}:PReturnObj<Ast>  = Maybe.getValue(res1)
    // return makeJustParserResult(r, rem)
}
export function term(sinput: string): ParserResult<TNode> {
    const rr = choiceN([factor_times_term_1, factor_only], sinput)
    return rr
}
export function factor_times_term_1(sinput: string): ParserResult<TNode> {
    return followedBy3(factor, parseMultiplySign, term, (x:TNode, y:string, z:TNode) => Tree.MultNode.make(x,z))(removeLeadingWhitespace(sinput))
    // const s = removeLeadingWhitespace(sinput)
    // const p = followedBy3(factor, parseMultiplySign, term, (x:TNode, y:string, z:TNode) => Tree.MultNode.make(x,z))
    // return p(s)
    // const res1 = factor(s)
    // if(Maybe.isNothing(res1)) {
    //     return Maybe.nothing()
    // }
    // const {result: r1, remaining: rem1}: PReturnObj<Ast> = Maybe.getValue(res1)
    // const res2 = parseMultiplySign(rem1)
    // if(Maybe.isNothing(res2)) {
    //     return Maybe.nothing()
    // }
    // const {result: r2, remaining: rem2}: PReturnObj<string> = Maybe.getValue(res2)
    // const res3 = term(rem2)
    // if(Maybe.isNothing(res3)) {
    //     return Maybe.nothing()
    // }
    // const {result: r3, remaining: rem3}: PReturnObj<Ast> = Maybe.getValue(res3)
    // let left = r1
    // let right = r3
    // let newnode = Tree.MultNode.make(left, right)
    // return makeJustParserResult(newnode, rem3)
}
// export function factor_times_term_2(sinput: string): ParserResult<TNode> {
//     return followedBy3(factor, parseMultiplySign, term, (left: Tree.TreeNode, op: string, right: TNode) => Tree.MultNode.make(left,right))(removeLeadingWhitespace(sinput))
// }
export function factor_only(sinput: string): ParserResult<TNode> {
    return bind(factor, (x: TNode) => eta (x))(removeLeadingWhitespace(sinput))
    // const s = removeLeadingWhitespace(sinput)
    // const res1 = factor(s)
    // if(Maybe.isNothing(res1)) {
    //     return Maybe.nothing()
    // }
    // let {result: r, remaining: rem}: PReturnObj<Ast> = Maybe.getValue(res1)
    // return makeJustParserResult(r, rem)
}
export function factor(sinput: string): ParserResult<TNode> {
    return choiceN([parseNumberExp, parseBracketExp], removeLeadingWhitespace(sinput))
}
export function parseBracketExp(sinput: string): ParserResult<TNode> {
    return followedBy3(parseOpenBracket, expression, parseCloseBracket, (x:string, y:Ast, z:string) => y)(removeLeadingWhitespace(sinput))
    // const s = removeLeadingWhitespace(sinput)
    // const p = followedBy3(parseOpenBracket, expression, parseCloseBracket, (x:string, y:Ast, z:string) => y)
    // return p(s)
    // const res1 = parseOpenBracket(s)
    // if(Maybe.isNothing(res1)) {
    //     return Maybe.nothing()
    // }
    // const {result: r1, remaining: rem1}: PReturnObj<string> = Maybe.getValue(res1)
    // const res2 = expression(rem1)
    // if(Maybe.isNothing(res2)) {
    //     return Maybe.nothing()
    // }
    // const {result: r2, remaining: rem2}: PReturnObj<Ast> = Maybe.getValue(res2)
    // const res3 = parseCloseBracket(rem2)
    // if(Maybe.isNothing(res3)) {
    //     return Maybe.nothing()
    // }
    // const {result: r3, remaining: rem3}: PReturnObj<string> = Maybe.getValue(res3)
    // const n = r2
    // const rnode = Tree.BracketNode.make(n)
    // return makeJustParserResult((rnode), rem3)
}

export function parseNumberExp(sinput: string) : ParserResult<TNode> {
    return bind(parseNumber, (s: string) => eta(Tree.NumberNode.make(parseInt(s))))(removeLeadingWhitespace(sinput))
    // const s = removeLeadingWhitespace(sinput)
    // const res1 = parseNumber(s)
    // if(Maybe.isNothing(res1)) {
    //     return Maybe.nothing()
    // }
    // const {result: r1, remaining: rem1}: PReturnObj<string> = Maybe.getValue(res1)
    // const node = Tree.NumberNode.make(parseInt(r1))
    // return makeJustParserResult((node), rem1)
}
