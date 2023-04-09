import * as Tree from "./tree"
import {treeAsNumber, treeAsString} from "./walker"
import {
    Ast, 
    ParserTupleAst, ParserResultAst, 
    failed, isDone,
    make_result, make_failed, 
    ast_remain, ast_value} from "./ast_functions"
import * as AST from "./ast_functions"
import * as PT from "./parser_pair"
import * as PR from "./parser_result"
import {ParserType} from "./parser_type"
import {parser_or, sequence} from "./parser_combiners"
import {
    removeLeadingWhitespace,
    parseMultSign, parseMultiplySign,
    parseAdditionSign, parsePlusSignToAst,
    parseOpenBracket, parseCloseBracket
} from "./primitives"
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
function expression(sinput: string): ParserResultAst {
    const r = parser_or([term_and_expression_2, term_only], sinput)
    return r
}
function term_and_expression_1(sinput: string): ParserResultAst {
    const s  = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(failed(t)) {
        return make_failed()
    }
    const plusresult = parseAdditionSign(ast_remain(t))
    if(failed(plusresult)) {
        return make_failed()
    }
    const rest: string = ast_remain(plusresult) as string
    let exp = expression(rest)
    if(failed(exp)) {
        return make_failed()
    }
    const tnode = ast_value(t) as Tree.TreeNode
    const expnode = ast_value(exp) as Tree.TreeNode
    let newast = Tree.AddNode.make(tnode, expnode)
    return make_result(newast, ast_remain(exp))
}
function term_and_expression_2(sinput: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = ast_value(results[0]) as Tree.TreeNode
        const expnode = ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.AddNode.make(tnode, expnode)
        return PT.make(newast, ast_remain(results[2]))
    } 
    return sequence([term, parseAdditionSign, expression], sinput, f)
}
function term_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(failed(t)) {
        return t
    }
    const tnode = ast_value(t) as Tree.TreeNode
    return make_result(tnode, ast_remain(t))
}
/**
 * parse a term
 * - first try 
 *      term ::= factor * term 
 * - if that fails try 
 *      factor
*/
function term(sinput: string): ParserResultAst {
    const rr = parser_or([factor_and_term_2, factor_only], sinput)
    return rr
}
function factor_and_term_1(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(failed(fac) || isDone(fac)) {
        return make_failed()
    }
    const multresult = parseMultiplySign(ast_remain(fac))
    if(failed(multresult)) {
        return make_failed()
    }
    let t = term(ast_remain(multresult))
    if(failed(t)) {
        return make_failed()
    }
    let fnode = ast_value(fac) as Tree.TreeNode
    let tnode = ast_value(t) as Tree.TreeNode
    return make_result(Tree.MultNode.make(fnode, tnode), ast_remain(t))
}
function factor_and_term_2(s: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = ast_value(results[0]) as Tree.TreeNode
        const expnode = ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.MultNode.make(tnode, expnode)
        return PT.make(newast, ast_remain(results[2]))
    } 
    const rr = sequence([factor, parseMultiplySign, term], s, f)
    return rr
}
function factor_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(failed(fac)) {
        return make_failed()
    }
    return fac
}

/**
 * parse a factor
 * - first try
 *      factor :== number
 * - if that fails try 
 *      factor = ( exp ) 
*/
function factor(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    return parser_or([parse_number, parse_bracket], s)
}
function parse_bracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const openb = parseOpenBracket(s)
    if(failed(openb)) {
        return make_failed()
    }
    const expresult = expression(ast_remain(openb))
    if(failed(expresult)) {
        return make_failed()
    }
    const closeb = parseCloseBracket(ast_remain(expresult))
    if(failed(closeb)) {
        return make_failed()
    }
    const rem = ast_remain(closeb)
    const newexpnode = ast_value(expresult) as Tree.TreeNode
    const rnode = Tree.BracketNode.make(newexpnode)
    return make_result(rnode, rem)
}
function parse_number(s: string) : ParserResultAst {

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
    let {numstr, rem} = extractNumber(s)
    if(numstr == "") {
        return make_failed()
    } else {
        const numnode = Tree.NumberNode.make(parseInt(numstr))
        return make_result(numnode, rem)
    }
}


/******************************************************************************/
// Tests 
/*******************************************************************************/

export function test_parser() {
    test_sequence()
    test_add()
    test_whitespace()
    test_parse_number() 
}

function test_sequence() {
    const r1 = factor_and_term_1("2 + 3")
    const r2 = factor_and_term_2("2 + 3")
    const r3 = factor_and_term_1("2 * 3")
    const r4 = factor_and_term_2("2 * 3")

    const x1 = term_and_expression_1(" 2 + 3")
    const x2 = term_and_expression_2(" 2 + 3")

}
function test_whitespace() {
    let ss = " 1234"
    const ss2 = removeLeadingWhitespace(ss)
    const r1 = removeLeadingWhitespace("")
    const r2 = removeLeadingWhitespace("  ff")
    const r3 = removeLeadingWhitespace("hh")
}
function test_parse_number() {
    const r1 = parse_number("")
    const r2 = parse_number("aaa")
    const r3 = parse_number("1")
    const r4 = parse_number("123")
    const r5 = parse_number("123 ")
    const r6 = parse_number("123X ")
    const r7 = parse_number("  123X ")
}
function test_add() {
    function test_one(expression_str: string)
    {
        console.log(`testing string ${expression_str}`)
        const r1 = expression(expression_str)
        const s1 = treeAsString(ast_value(r1) as Tree.TreeNode)
        const v1 = treeAsNumber(ast_value(r1) as Tree.TreeNode)
        console.log(`input ${expression_str} result ${s1} value: ${v1} \n`)
    }
    test_one("1 + 2")
    test_one("2 * 3")
    test_one(" 1 + 2")
    test_one(" 2 * 3")
    test_one("2*(3 + 4)")
    test_one("2*(3 + 4) + 3 + 4* 5")
    test_one(" 2*(3+4) + 3+4* 5")
    test_one(" 2*(3+4)+ 3+4* 5")
}
test_parser()