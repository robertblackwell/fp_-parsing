import * as Tree from "../src/tree"
import {treeAsNumber, treeAsString} from "../src/walker"
import {
    Ast, 
    ParserTupleAst, ParserResultAst, 
    failed, isDone,
    make_result, make_failed, 
    ast_remain, ast_value} from "../src/ast_functions"
import {assert} from "./test_helpers"
import * as Maybe from "../src/maybe"
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
    expression, expression_1, expression_2,
    term_and_expression_1,
    term_and_expression_2,
    term_and_expression_3,
    parse_number_1,
    parse_bracket_1,
} from "../src/parser"
/******************************************************************************/
// Tests 
/*******************************************************************************/

export function test_parser() {
    test_parser_01()
    test_expression()
    // test_whitespace()
    // test_parse_number() 
}
function test_one(p: (sinput: string) => PR.PResult<Ast>, sinput: string, expected: string, msg: string) {
    const r = p(sinput)
    console.log(r)
    if(Maybe.isNothing(r)) {
        assert(false, `${msg} failed`)
    } else {
        const v = Maybe.get_value(r).value
        const vstr = treeAsString(v)
        assert(vstr == expected, `${msg}`)
    }
}
function test_one_fail(p: (sinput: string) => PR.PResult<Ast>, sinput: string, msg: string) {
    const r = p(sinput)
    assert(!Maybe.isNothing(r), `should have failed but did not r: ${r} msg: ${msg}`)
}

function test_parser_01() {
    test_one(factor_and_term_1, "2 * 3", "2 * 3", "testing factor_and_test_1 on 2 * 3")
    test_one(factor_and_term_2, "2 * 3", "2 * 3", "testing factor_and_test_2 on 2 * 3")
    test_one(term_and_expression_1, "2 + 3", "2 + 3", "testing term_and_expression_1 on 2 + 3")
    test_one(term_and_expression_2, "2 + 3", "2 + 3", "testing term_and_expression_2 on 2 + 3")

    
}
function test_whitespace() {
    let ss = " 1234"
    const ss2 = removeLeadingWhitespace(ss)
    const r1 = removeLeadingWhitespace("")
    const r2 = removeLeadingWhitespace("  ff")
    const r3 = removeLeadingWhitespace("hh")
}
function test_expression() {
    function test_one_fail(p: (sinput: string) => PR.PResult<Ast>, sinput: string, msg: string) {
        const r = p(sinput)
        assert(Maybe.isNothing(r), `should have failed but did not r: ${r} msg: ${msg}`)
    }
    function test_one(p: ParserType<Ast>, expression_str: string, expected_string: string, msg: string)
    {
        console.log(`testing string ${expression_str}`)
        const r1 = p(expression_str)
        if(Maybe.isNothing(r1)) {
            assert(false, msg)
        } else {
            const s1 = treeAsString(ast_value(r1) as Tree.TreeNode)
            const v1 = treeAsNumber(ast_value(r1) as Tree.TreeNode)
            console.log(`input ${expression_str} result ${s1} value: ${v1} \n`)
            const bb = s1 == expected_string
            assert(s1 == expected_string, `FAILED : ${msg}`)
        }

    }
    function test_all_number() {
        function test_one_number(p:(s: string) => PR.PResult<Ast>) {
            test_one_fail(p, "", `testing number ""` )
            test_one_fail(p, "aaa", `testing number "aaa"`)
            test_one(p, "1", "1", `testing "1"`)
            test_one(p, "123", "123", `testing "123"`)
            test_one(p, "123 ", "123", `testing "123 "`)
            test_one(p, "123X ", "123", `testing "123X "`)
            test_one(p, "  123X ", "123", `testing "  123X "`)
        }
        test_one_number(parse_number_1)
    }
    function test_all_brackets_parser() {
        function tests_one_brackets_parser(p: ParserType<Ast>) {
            test_one(p, "(1 * 2)", "(1 * 2)", `testing brackets`)
            test_one(p, " ( 1 * 2)", "(1 * 2)", `testing brackets`)
            test_one(p, "(1 * 2*3)", "(1 * 2 * 3)", `testing term_and_factor`)
        }
        tests_one_brackets_parser(parse_bracket_1)
    }
    function test_all_factor_and_term() {
        function tests_one_term_and_factor_parser(p: ParserType<Ast>) {
            test_one(p, "1 * 2 * 3", "1 * 2 * 3", `testing term_and_factor`)
            test_one(p, "1 * 2*  3", "1 * 2 * 3", `testing term_and_factor`)
            test_one(p, "1 * 2*3", "1 * 2 * 3", `testing term_and_factor`)
        }
        tests_one_term_and_factor_parser(factor_and_term_1)
        tests_one_term_and_factor_parser(factor_and_term_2)
    }
    function test_all_term_and_expression() {
        function tests_one_term_and_expression_parser(p: ParserType<Ast>) {
            test_one(p, "1 + 2 + 3", "1 + 2 + 3", `testing term_and_expression`)
            test_one(p, "1 + 2+  3", "1 + 2 + 3", `testing term_and_expression`)
            test_one(p, "1 + 2+3", "1 + 2 + 3", `testing term_and_expression`)
        }
        tests_one_term_and_expression_parser(term_and_expression_1)
        tests_one_term_and_expression_parser(term_and_expression_2)
        tests_one_term_and_expression_parser(term_and_expression_3)
    }


    function test_all_expression_parsers() {
        function tests_one_expression_parser(p: ParserType<Ast>) {
            test_one(p, "1 + 2", "1 + 2", `testing expression("1 + 2")`)
            test_one(p, "2 * 3", "2 * 3", `testing expression("2 * 3")`)
            test_one(p, " 1+2", "1 + 2", `testing expression("1 + 2")`)
            test_one(p, " 2*3", "2 * 3", `testing expression("2 * 3")`)
            test_one(p, "2*(3 + 4)", "2 * (3 + 4)", `testing expression("2*(3 + 4)")`)
            test_one(p, "2*(3 + 4) + 3 + 4* 5", "2 * (3 + 4) + 3 + 4 * 5", `testing expression("2*(3 + 4) + 3 + 4* 5")`)
            test_one(p, " 2*(3+4) + 3+4* 5",    "2 * (3 + 4) + 3 + 4 * 5", `testing expression("2*(3 + 4) + 3+4* 5")`)
            test_one(p, " 2*(3+4)+ 3+4* 5",     "2 * (3 + 4) + 3 + 4 * 5", `testing expression(" 2*(3+4)+ 3+4* 5")`)
        }
        tests_one_expression_parser(expression_1)
        tests_one_expression_parser(expression_2)
    }
    test_all_number()
    test_all_brackets_parser()
    test_all_factor_and_term()
    test_all_term_and_expression()
    test_all_expression_parsers()
}
test_parser()