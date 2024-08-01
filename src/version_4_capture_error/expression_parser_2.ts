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

export function expression(sinput: string): ParserResult<Ast> {
    return whitespaceIfy(choice(term_plus_expression, term_only))(sinput)
}
export function term_plus_expression(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(followedBy3(term, parseAdditionSign, expression, (x:TNode, y:string, z:TNode) => Tree.AddNode.make(x,z)))(sinput)
}
export function term_only(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(bind(term, (x: TNode) => eta (x)))(sinput)
}
export function term(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(choice(factor_times_term, factor_only))(sinput)
}
export function factor_times_term(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(followedBy3(factor, parseMultiplySign, term, (x:TNode, y:string, z:TNode) => Tree.MultNode.make(x,z)))(sinput)
}
export function factor_only(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(bind(factor, (x: TNode) => eta (x)))(sinput)
}

export function factor(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(choice(parseNumberExp, parseBracketExp))(sinput)
}
export function parseBracketExp_2(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(followedBy3(parseOpenBracket, expression, parseCloseBracket, (x:string, y:Ast, z:string) => Tree.BracketNode.make(y)))(sinput)
}
export function parseNumberExp_2(sinput: string) : ParserResult<TNode> {
    return whitespaceIfy(bind(parseNumber, (s: string) => eta(Tree.NumberNode.make(parseInt(s)))))(sinput)
}
export function parseBracketExp(sinput: string): ParserResult<TNode> {
    return whitespaceIfy(followedBy3(parseOpenBracket, expression, parseCloseBracket, (x:string, y:Ast, z:string) => Tree.BracketNode.make(y)))(sinput)
}
export function parseNumberExp(sinput: string) : ParserResult<TNode> {
    return whitespaceIfy(bind(parseNumber, (s: string) => eta(Tree.NumberNode.make(parseInt(s)))))(sinput)
}

