import * as Tree from "./tree"
import {treeAsNumber, treeAsString} from "./walker"
import {
    Ast, 
    ParserTupleAst, ParserResultAst, 
    failed, isDone,
    make_result, make_failed, 
    ast_remain, ast_value} from "./ast_functions"
import {assert} from "../tests/test_helpers"
import * as AST from "./ast_functions"
import * as PT from "./parser_pair"
import * as PR from "./parser_result"
import * as PM from "./parser_monad" 
import * as PA from "./parser_applicative"
import {ParserType} from "./parser_type"
import * as PC from "./parser_combiners"
import {
    removeLeadingWhitespace,
    parseMultSign, parseMultiplySign,
    parseAdditionSign, parsePlusSignToAst,
    parseOpenBracket, parseCloseBracket
} from "./primitives"
import { parseMultSignToString, parsePlusSignToString, createPredicateParser, createPredicateParserStripLeadingWhiteSpace } from "./string_primitives"

type P<T> = ParserType<T>
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
export function expression(sinput: string): ParserResultAst {
    return PM.choice(term_and_expression, term_only)(sinput)
}
export function term_and_expression(sinput: string): ParserResultAst {
    function f(termNode: Ast, plussign: string, expNode: Ast): P<Ast> {
        let newast = Tree.AddNode.make(termNode, expNode)
        return PM.eta(newast)
    } 
    const newparser = PM.bindM3(term, parsePlusSignToString, expression, f)
    return newparser(sinput)
}
export function term_only(sinput: string): ParserResultAst {
    return term(removeLeadingWhitespace(sinput))
}
export function term(sinput: string): ParserResultAst {
    return PM.choice(factor_and_term, factor_only)(sinput)
}
export function factor_and_term(sinput: string): ParserResultAst {
    function f(factorNode: Ast, multsign: string, termNode: Ast): P<Ast> {
        let newast = Tree.MultNode.make(factorNode, termNode)
        return PM.eta(newast)
    } 
    const newparser = PM.bindM3(factor_only, parseMultSignToString, term, f)
    return newparser(sinput)
}
export function factor_only(sinput: string): ParserResultAst {
    return PM.choice(parse_number, parse_bracket)(removeLeadingWhitespace(sinput))
}
export function parse_bracket(sinput: string): ParserResultAst {
    function f(ob: string, bnode: Tree.TreeNode, cb: string) {
        return PM.eta(Tree.BracketNode.make(bnode))
    }
    const openbracket = createPredicateParserStripLeadingWhiteSpace((s: string) => (s === "("))
    const closebracket = createPredicateParserStripLeadingWhiteSpace((s: string) => (s === ")"))
    return PM.bindM3(openbracket, expression, closebracket, f)(sinput)
}
export function parse_number(sinput: string) : ParserResultAst {
    const digitParser = createPredicateParser((ss: string) => ((ss.substring(0, 1).match(/[0-9]/g) != null)))
    const manydigits = PC.many(digitParser)
    function f(ss: string[]): P<Ast> {
        const an_ast = (Tree.NumberNode.make(parseInt(ss.join(""))) as Ast)
        return PM.eta(an_ast)
    }
    function g(ss: string[]): Ast {
        return Tree.NumberNode.make(parseInt(ss.join(""))) as Ast
    }
    const applicative_result = PA.ap(PM.eta(g), manydigits)
    const monadic_result = PM.bind(manydigits, f)(removeLeadingWhitespace(sinput))
    //the two results are the same, return one of them
    return monadic_result
}
