import * as Tree from "../tree"
import * as AST from "../ast_functions"
import {
    Parser, ParserResult, PReturnObj, makeFailedParserResult, makeParserResult, bindM3, bindM2, bind, eta
} from "../version_4_capture_error/parser_monad"
import {isFailedResult} from "./result_monad"
import * as Result from "./result_monad"
import {
    choice, choiceN, 
    stripLeadingWhitespace,
    parseNumber,
    parseMultiplySign,
    parseAdditionSign,
    parseOpenBracket, 
    parseCloseBracket,
    followedBy,
    followedBy3,
    whitespaceIfy
} from "../version_4_capture_error/primitives"

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


// export function expression_2(sinput: string): ParserResult<Ast> {
//     return whitespaceIfy(choice(term_plus_expression_2, term_only_2))(sinput)
// }
// export function term_plus_expression_2(sinput: string): ParserResult<TNode> {
//     return whitespaceIfy(followedBy3(term_2, parseAdditionSign, expression_2, (x:TNode, y:string, z:TNode) => Tree.AddNode.make(x,z)))(sinput)
// }
// /**
//  * term_only 
//  */
// export function term_only_2(sinput: string): ParserResult<TNode> {
//     return whitespaceIfy(bind(term_2, (x: TNode) => eta (x)))(sinput)
// }
// export function term_2(sinput: string): ParserResult<TNode> {
//     return whitespaceIfy(choice(factor_times_term_2, factor_only_2))(sinput)
// }
// /**
//  * factor_times_term
//  */
// export function factor_times_term_2(sinput: string): ParserResult<TNode> {
//     return whitespaceIfy(followedBy3(factor_2, parseMultiplySign, term_2, (x:TNode, y:string, z:TNode) => Tree.MultNode.make(x,z)))(sinput)
// }
// export function factor_only_2(sinput: string): ParserResult<TNode> {
//     return whitespaceIfy(bind(factor_2, (x: TNode) => eta (x)))(sinput)
// }

// export function factor_2(sinput: string): ParserResult<TNode> {
//     return whitespaceIfy(choice(parseNumberExp_1, parseBracketExp_1))(sinput)
// }
// export function parseBracketExp_2(sinput: string): ParserResult<TNode> {
//     return whitespaceIfy(followedBy3(parseOpenBracket, expression_2, parseCloseBracket, (x:string, y:Ast, z:string) => Tree.BracketNode.make(y)))(sinput)
// }
// export function parseNumberExp_2(sinput: string) : ParserResult<TNode> {
//     return whitespaceIfy(bind(parseNumber, (s: string) => eta(Tree.NumberNode.make(parseInt(s)))))(sinput)
// }

//
// Below are the _1 functions
//
export function expression(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const r = choiceN([term_plus_expression, term_only], s)
    return r
}
export function term_plus_expression(sinput: string): ParserResult<TNode> {
    const s  = removeLeadingWhitespace(sinput)
    const res1 = term(s)
    if(isFailedResult(res1)) {
        return makeFailedParserResult(res1.code, res1.rem)
    }
    const {result: r1, remaining: rem1}  = Result.getValue(res1)
    const res2 = parseAdditionSign(rem1)
    if(isFailedResult(res2)) {
        return makeFailedParserResult(res2.code, res2.rem)
    }
    const {result: r2, remaining: rem2}  = Result.getValue(res2)
    let res3 = expression(rem2)
    if(isFailedResult(res3)) {
        return makeFailedParserResult(res3.code, res3.rem)
    }
    let {result: r3, remaining: rem3} = Result.getValue(res3)
    if(r1 === null || r3 === null) {
        throw Error("") ///@todo - fix this
    }
    let newast = Tree.AddNode.make(r1, r3)
    return makeParserResult(newast, rem3)
}
export function term_only(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = term(s)
    if(isFailedResult(res1)) {
        return makeFailedParserResult(res1.code, res1.rem)
    }
    const {result: r, remaining: rem}  = Result.getValue(res1)
    return makeParserResult(r, rem)
}
export function term(sinput: string): ParserResult<TNode> {
    const rr = choiceN([factor_times_term, factor_only], removeLeadingWhitespace(sinput))
    return rr
}
export function factor_times_term(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = factor(s)
    if(isFailedResult(res1)) {
        return makeFailedParserResult(res1.code, res1.rem)
    }
    const {result: r1, remaining: rem1} = Result.getValue(res1)
    const res2 = parseMultiplySign(removeLeadingWhitespace(rem1))
    if(isFailedResult(res2)) {
        return makeFailedParserResult(res2.code, res2.rem)
    }
    const {result: r2, remaining: rem2} = Result.getValue(res2)
    const res3 = term(rem2)
    if(isFailedResult(res3)) {
        return makeFailedParserResult(res3.code, res3.rem)
    }
    const {result: r3, remaining: rem3} = Result.getValue(res3)
    let left = r1
    let right = r3
    let newnode = Tree.MultNode.make(left, right)
    return makeParserResult(newnode, rem3)
}
export function factor_only(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = factor(s)
    if(isFailedResult(res1)) {
        return makeFailedParserResult(res1.code, res1.rem)
    }
    let {result: r, remaining: rem} = Result.getValue(res1)
    return makeParserResult(r, rem)
}
export function factor(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    return choiceN([parseNumberExp, parseBracketExp], s)
}

export function parseBracketExp(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = parseOpenBracket(s)
    if(isFailedResult(res1)) {
        return makeFailedParserResult(res1.code, res1.rem)
    }
    const {result: r1, remaining: rem1} = Result.getValue(res1)
    const res2 = expression(rem1)
    if(isFailedResult(res2)) {
        return makeFailedParserResult(res2.code, res2.rem)
    }
    const {result: r2, remaining: rem2} = Result.getValue(res2)
    const res3 = parseCloseBracket(rem2)
    if(isFailedResult(res3)) {
        return makeFailedParserResult(res3.code, res3.rem)
    }
    const {result: r3, remaining: rem3} = Result.getValue(res3)
    const n = r2
    const rnode = Tree.BracketNode.make(n)
    return makeParserResult((rnode), rem3)
}
export function parseNumberExp(sinput: string) : ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = parseNumber(s)
    if(isFailedResult(res1)) {
        return makeFailedParserResult(res1.code, res1.rem)
    }
    const {result: r1, remaining: rem1} = Result.getValue(res1)
    const node = Tree.NumberNode.make(parseInt(r1))
    return makeParserResult((node), rem1)
}
