import * as Tree from "../src/tree"
import {treeAsNumber, treeAsString} from "../src/walker"
import {
    Ast, 
    ParserTupleAst, ParserResultAst, 
    failed, isDone,
    make_result, make_failed, 
    ast_remain, ast_value} from "../src/ast_functions"
import * as AST from "../src/ast_functions"
import * as PT from "../src/parser_pair"
import * as PR from "../src/parser_result"
import {ParserType} from "../src/parser_type"
import {parser_or, sequence} from "../src/parser_combiners"
import {
    removeLeadingWhitespace,
    parseMultSign, parseMultiplySign,
    parseAdditionSign, parsePlusSignToAst,
    parseOpenBracket, parseCloseBracket
} from "../src/primitives"
import {
    factor_and_term_1,
    factor_and_term_2,
    expression,
    term_and_expression_1,
    term_and_expression_2,
    parse_number,
} from "../src/parser"
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
// test_parser()