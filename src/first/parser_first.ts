import * as Tree from "../tree"
import * as AST from "../ast_functions"
import * as PT from "../parser_pair"
import * as PR from "../parser_result"
import {ParserType} from "../parser_type"
import * as PC from "./combiners"
import {
    removeLeadingWhitespace, 
    parseAdditionSignToAst, 
    parseMultiplySignToAst, 
    parseOpenBracket, 
    parseCloseBracket} from "./primitives"

type Ast = AST.Ast
type StringParser = ParserType<string>
type StringParserResult = PR.PResult<string>
type ParserTupleAst = PT.PPair<Ast>
type ParserResultAst = PR.PResult<Ast>

type P<T> = ParserType<T>
type ParserAst = P<Ast>
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
export function expression(sinput: string): ParserResultAst {
    const r = PC.parser_or([term_and_expression, term_only], sinput)
    return r
}
export function term_and_expression_old(sinput: string): ParserResultAst {
    const s  = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(AST.failed(t)) {
        return AST.make_failed()
    }
    const plusresult = parseAdditionSignToAst(AST.ast_remain(t))
    if(AST.failed(plusresult)) {
        return AST.make_failed()
    }
    const rest: string = AST.ast_remain(plusresult) as string
    let exp = expression(rest)
    if(AST.failed(exp)) {
        return AST.make_failed()
    }
    const tnode = AST.ast_value(t) as Tree.TreeNode
    const expnode = AST.ast_value(exp) as Tree.TreeNode
    let newast = Tree.AddNode.make(tnode, expnode)
    return AST.make_result(newast, AST.ast_remain(exp))
}
export function term_and_expression(sinput: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = AST.ast_value(results[0]) as Tree.TreeNode
        const expnode = AST.ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.AddNode.make(tnode, expnode)
        return PT.make(newast, AST.ast_remain(results[2]))
    } 
    return PC.sequence([term, parseAdditionSignToAst, expression], sinput, f)
}

/*
*  term_only
*/
export function term_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(AST.failed(t)) {
        return t
    }
    const tnode = AST.ast_value(t) as Tree.TreeNode
    return AST.make_result(tnode, AST.ast_remain(t))
}

export function term(sinput: string): ParserResultAst {
    const rr = PC.parser_or([factor_and_term_2, factor_only], sinput)
    return rr
}
/*
* factor_and_term variants
*/
export function factor_and_term(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(AST.failed(fac) || AST.isDone(fac)) {
        return AST.make_failed()
    }
    const multresult = parseMultiplySignToAst(AST.ast_remain(fac))
    if(AST.failed(multresult)) {
        return AST.make_failed()
    }
    let t = term(AST.ast_remain(multresult))
    if(AST.failed(t)) {
        return AST.make_failed()
    }
    let fnode = AST.ast_value(fac) as Tree.TreeNode
    let tnode = AST.ast_value(t) as Tree.TreeNode
    return AST.make_result(Tree.MultNode.make(fnode, tnode), AST.ast_remain(t))
}
export function factor_and_term_2(s: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode =  AST.ast_value(results[0]) as Tree.TreeNode
        const expnode =  AST.ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.MultNode.make(tnode, expnode)
        return PT.make(newast,  AST.ast_remain(results[2]))
    } 
    const rr = PC.sequence([factor, parseMultiplySignToAst, term], s, f)
    return rr
}
export function factor_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(AST.failed(fac)) {
        return AST.make_failed()
    }
    return fac
}
export function factor(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    return PC.parser_or([parse_number, parse_bracket], s)
}
/*
* bracket variants
*/
export function parse_bracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const openb = parseOpenBracket(s)
    if(AST.failed(openb)) {
        return AST.make_failed()
    }
    const expresult = expression(AST.ast_remain(openb))
    if(AST.failed(expresult)) {
        return AST.make_failed()
    }
    const closeb = parseCloseBracket(AST.ast_remain(expresult))
    if(AST.failed(closeb)) {
        return AST.make_failed()
    }
    const rem =  AST.ast_remain(closeb)
    const newexpnode =  AST.ast_value(expresult) as Tree.TreeNode
    const rnode = Tree.BracketNode.make(newexpnode)
    return AST.make_result(rnode, rem)
}
/*
* number variants
*/
export function parse_number(s: string) : ParserResultAst {

    function isDigit(char: string) {
        return (char.length == 1) && (/^\d$/.test(char))
    }
    function extractNumber(str: string): {numstr: string, rem: string} {
        if(str.length == 0) {
            return {numstr:"", rem: ""}
        }
        const ch = str.substring(0, 1)
        if(isDigit(ch)) {
            let {numstr, rem} = extractNumber(str.slice(1))
            return {numstr: ch+numstr, rem}
        } else {
            return {numstr: "", rem: str}
        } 
    }
    let {numstr, rem} = extractNumber(removeLeadingWhitespace(s))
    if(numstr == "") {
        return AST.make_failed()
    } else {
        const numnode = Tree.NumberNode.make(parseInt(numstr))
        return AST.make_result(numnode, rem)
    }
}
