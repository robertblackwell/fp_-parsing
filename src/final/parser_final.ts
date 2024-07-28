import * as Tree from "../tree"
import {Ast, ParserResultAst} from "../ast_functions"
import * as PM from "../parser_monad" 
import * as PA from "../parser_applicative"
import * as PC from "./combiners"
import { 
    createPredicateParser, 
    createPredicateParserStripLeadingWhiteSpace } from "./primitives"

const parseMultSignToString = createPredicateParserStripLeadingWhiteSpace((s: string) => (s == "*")) 
const parsePlusSignToString = createPredicateParserStripLeadingWhiteSpace((s: string) => (s == "+")) 
export function removeLeadingWhitespace(s: string): string {
    if((s.length > 0) && (s.substring(0, 1) == " ")) {
        return removeLeadingWhitespace(s.slice(1))
    }
    return s.slice(0)
}
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
        return PM.eta(Tree.AddNode.make(termNode, expNode))
        // return PM.eta(newast)
    } 
    return PM.bindM3(term, parsePlusSignToString, expression, f)(sinput)
    // return newparser(sinput)
}
export function term_only(sinput: string): ParserResultAst {
    return term(removeLeadingWhitespace(sinput))
}
export function term(sinput: string): ParserResultAst {
    return PM.choice(factor_and_term, factor_only)(sinput)
}
export function factor_and_term(sinput: string): ParserResultAst {
    function f(factorNode: Ast, multsign: string, termNode: Ast): P<Ast> {
        return PM.eta(Tree.MultNode.make(factorNode, termNode))
        // return PM.eta(newast)
    } 
    return PM.bindM3(factor_only, parseMultSignToString, term, f)(sinput)
    // return newparser(sinput)
}
export function factor_only(sinput: string): ParserResultAst {
    return PM.choice(parse_number, parse_bracket)(removeLeadingWhitespace(sinput))
}
export function parse_bracket(sinput: string): ParserResultAst {
    const predicateWS = (candidate: string) => createPredicateParserStripLeadingWhiteSpace((s: string) => (s === candidate))
    function f(ob: string, bnode: Tree.TreeNode, cb: string) {
        return PM.eta(Tree.BracketNode.make(bnode))
    }
    return PM.bindM3(predicateWS("("), expression, predicateWS(")"), f)(sinput)
}
export function parse_number(sinput: string) : ParserResultAst {
    const digitParser = createPredicateParser((ss: string) => ((ss.substring(0, 1).match(/[0-9]/g) != null)))
    const manydigits = PC.many(digitParser)
    function ff(ss: string[]): P<Ast> {
        const an_ast = (Tree.NumberNode.make(parseInt(ss.join(""))) as Ast)
        return PM.eta(an_ast)
    }
    function g(ss: string[]): Ast {
        return Tree.NumberNode.make(parseInt(ss.join(""))) as Ast
    }
    const f = (ss: string[]) => PM.eta(g(ss))
    const applicative_result = PA.ap(PM.eta(g), manydigits)
    const monadic_result = PM.bind(manydigits, f)(removeLeadingWhitespace(sinput))
    //the two results are the same, return one of them
    return monadic_result
}
