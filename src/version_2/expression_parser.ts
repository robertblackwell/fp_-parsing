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
}
export function term_only(sinput: string): ParserResult<TNode> {
    return bind(term, (x: TNode) => eta (x))(removeLeadingWhitespace(sinput))
}
export function term(sinput: string): ParserResult<TNode> {
    const rr = choiceN([factor_times_term_1, factor_only], sinput)
    return rr
}
export function factor_times_term_1(sinput: string): ParserResult<TNode> {
    return followedBy3(factor, parseMultiplySign, term, (x:TNode, y:string, z:TNode) => Tree.MultNode.make(x,z))(removeLeadingWhitespace(sinput))
}
export function factor_only(sinput: string): ParserResult<TNode> {
    return bind(factor, (x: TNode) => eta (x))(removeLeadingWhitespace(sinput))
}
export function factor(sinput: string): ParserResult<TNode> {
    return choiceN([parseNumberExp, parseBracketExp], removeLeadingWhitespace(sinput))
}
export function parseBracketExp(sinput: string): ParserResult<TNode> {
    return followedBy3(parseOpenBracket, expression, parseCloseBracket, (x:string, y:Ast, z:string) => y)(removeLeadingWhitespace(sinput))
}

export function parseNumberExp(sinput: string) : ParserResult<TNode> {
    return bind(parseNumber, (s: string) => eta(Tree.NumberNode.make(parseInt(s))))(removeLeadingWhitespace(sinput))
}
