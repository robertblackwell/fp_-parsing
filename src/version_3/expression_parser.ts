import * as Tree from "../tree"
import * as AST from "../ast_functions"
import {
    ParserResult, bind, eta
} from "../version_3/parser_monad"

import {
    choice, 
    stripLeadingWhitespace,
    parseNumber,
    parseMultiplySign,
    parseAdditionSign,
    parseOpenBracket, 
    parseCloseBracket,
    followedBy3,
    whitespaceIfy
} from "../version_3/primitives"

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
/*
export function expression(sinput: string): ParserResult<Ast> {
    return choice(term_plus_expression_1, term_only)(removeLeadingWhitespace(sinput))
}
export function term_plus_expression_1(sinput: string): ParserResult<TNode> {
    return followedBy3(term, parseAdditionSign, expression, (x:TNode, y:string, z:TNode) => Tree.AddNode.make(x,z))(removeLeadingWhitespace(sinput))
}
export function term_only(sinput: string): ParserResult<TNode> {
    return bind(term, (x: TNode) => eta (x))(removeLeadingWhitespace(sinput))
}
export function term(sinput: string): ParserResult<TNode> {
    return choice(factor_times_term_1, factor_only)(removeLeadingWhitespace(sinput))
}
export function factor_times_term_1(sinput: string): ParserResult<TNode> {
    return followedBy3(factor, parseMultiplySign, term, (x:TNode, y:string, z:TNode) => Tree.MultNode.make(x,z))(removeLeadingWhitespace(sinput))
}
export function factor_only(sinput: string): ParserResult<TNode> {
    return bind(factor, (x: TNode) => eta (x))(removeLeadingWhitespace(sinput))
}
export function factor(sinput: string): ParserResult<TNode> {
    return choice(parseNumberExp, parseBracketExp)(removeLeadingWhitespace(sinput))
}
export function parseBracketExp(sinput: string): ParserResult<TNode> {
    return followedBy3(parseOpenBracket, expression, parseCloseBracket, (x:string, y:Ast, z:string) => y)(removeLeadingWhitespace(sinput))
}
export function parseNumberExp(sinput: string) : ParserResult<TNode> {
    return bind(parseNumber, (s: string) => eta(Tree.NumberNode.make(parseInt(s))))(removeLeadingWhitespace(sinput))
}
*/
/*********************************************************************************** */

export function expression(sinput: string): ParserResult<Ast> {
    return whitespaceIfy(choice(term_plus_expression_1, term_only))(sinput)
}
export function term_plus_expression_1(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(followedBy3(term, parseAdditionSign, expression, (x:TNode, y:string, z:TNode) => Tree.AddNode.make(x,z)))(sinput)
}
export function term_only(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(bind(term, (x: TNode) => eta (x)))(sinput)
}
export function term(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(choice(factor_times_term_1, factor_only))(sinput)
}
export function factor_times_term_1(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(followedBy3(factor, parseMultiplySign, term, (x:TNode, y:string, z:TNode) => Tree.MultNode.make(x,z)))(sinput)
}
export function factor_only(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(bind(factor, (x: TNode) => eta (x)))(sinput)
}
export function factor(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(choice(parseNumberExp, parseBracketExp))(sinput)
}
export function parseBracketExp(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(followedBy3(parseOpenBracket, expression, parseCloseBracket, (x:string, y:Ast, z:string) => Tree.BracketNode.make(y)))(sinput)
}
export function parseNumberExp(sinput: string) : ParserResult<TNode> {
    return whitespaceIfy(bind(parseNumber, (s: string) => eta(Tree.NumberNode.make(parseInt(s)))))(sinput)
}
