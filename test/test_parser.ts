import * as Tree from "../src/tree"
import {treeAsNumber, treeAsString} from "../src/walker"
import {
    Ast, 
    ParserTupleAst, ParserResultAst, 
    failed, isDone,
    make_result, make_failed, 
    ast_remain, ast_value} from "../src/ast_functions"
import {assert} from "../tests/test_helpers"
import * as UT from "../tests/test_helpers"
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
import * as P1 from "../src/parser_first"
import * as P2 from "../src/parser_final"

/******************************************************************************/
// Tests 
/*******************************************************************************/


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
function test_one_fail(p: (sinput: string) => PR.PResult<Ast>, sinput: string, msg: string) {
    const r = p(sinput)
    assert(Maybe.isNothing(r), `should have failed but did not r: ${r} msg: ${msg}`)
}

function test_parser_01() {
    function t(parserModule: any) {
        test_one(parserModule.factor_and_term, "2 * 3", "2 * 3", "testing factor_and_test_1 on 2 * 3")
        test_one(parserModule.term_and_expression, "2 + 3", "2 + 3", "testing term_and_expression_1 on 2 + 3")
    }
    UT.register("test_parser_01 P1", () => t(P1))
    UT.register("test_parser_01 P2", () => t(P2))
}
test_parser_01()

function define_tests() {
    const test_definitions = [
        function define_number_tests() {
            function t(parserModule: any) {
                test_one_fail(parserModule.parse_number, "", `testing number ""` )
                test_one_fail(parserModule.parse_number, "aaa", `testing number "aaa"`)
                test_one(parserModule.parse_number, "1", "1", `testing "1"`)
                test_one(parserModule.parse_number, "123", "123", `testing "123"`)
                test_one(parserModule.parse_number, "123 ", "123", `testing "123 "`)
                test_one(parserModule.parse_number, "123X ", "123", `testing "123X "`)
                test_one(parserModule.parse_number, "  123X ", "123", `testing "  123X "`)
            }
            UT.register("parser_number P1", () => t(P1))
            UT.register("parser_number P1", () => t(P2))
        },

        function define_brackets_tests() {
            function t(parserModule:any) {
                test_one(parserModule.parse_bracket, "(1 * 2)", "(1 * 2)", `testing brackets`)
                test_one(parserModule.parse_bracket, " ( 1 * 2)", "(1 * 2)", `testing brackets`)
                test_one(parserModule.parse_bracket, "(1 * 2*3)", "(1 * 2 * 3)", `testing term_and_factor`)
            }
            UT.register("test_bracket_parser P1", () => t(P1))
            UT.register("test_bracket_parser P1", () => t(P2))
        },

        function define_all_factor_and_term_tests() {
            function t(parserModule:any) {
                test_one(parserModule.factor_and_term, "1 * 2 * 3", "1 * 2 * 3", `testing term_and_factor`)
                test_one(parserModule.factor_and_term, "1 * 2*  3", "1 * 2 * 3", `testing term_and_factor`)
                test_one(parserModule.factor_and_term, "1 * 2*3", "1 * 2 * 3", `testing term_and_factor`)
            }
            UT.register("factor_and_term P1", () => t(P1))
        },

        function define_term_and_expression_tests() {
            function t(parserModule:any) {
                test_one(parserModule.term_and_expression, "1 + 2 + 3", "1 + 2 + 3", `testing term_and_expression`)
                test_one(parserModule.term_and_expression, "1 + 2+  3", "1 + 2 + 3", `testing term_and_expression`)
                test_one(parserModule.term_and_expression, "1 + 2+3", "1 + 2 + 3", `testing term_and_expression`)
            }
            UT.register("term and expression P1", () => t(P1))
            UT.register("term and expression P1", () => t(P2))
        },
        function define_expression_tests() {
            function t(parserModule:any) {
                test_one(parserModule.expression, "1 + 2", "1 + 2", `testing expression("1 + 2")`)
                test_one(parserModule.expression, "2 * 3", "2 * 3", `testing expression("2 * 3")`)
                test_one(parserModule.expression, " 1+2", "1 + 2", `testing expression("1 + 2")`)
                test_one(parserModule.expression, " 2*3", "2 * 3", `testing expression("2 * 3")`)
                test_one(parserModule.expression, "2*(3 + 4)", "2 * (3 + 4)", `testing expression("2*(3 + 4)")`)
                test_one(parserModule.expression, "2*(3 + 4) + 3 + 4* 5", "2 * (3 + 4) + 3 + 4 * 5", `testing expression("2*(3 + 4) + 3 + 4* 5")`)
                test_one(parserModule.expression, " 2*(3+4) + 3+4* 5",    "2 * (3 + 4) + 3 + 4 * 5", `testing expression("2*(3 + 4) + 3+4* 5")`)
                test_one(parserModule.expression, " 2*(3+4)+ 3+4* 5",     "2 * (3 + 4) + 3 + 4 * 5", `testing expression(" 2*(3+4)+ 3+4* 5")`)
            }
            UT.register("expression_tests P1", () => t(P1))
        },
    ]
    // call each definition function
    test_definitions.forEach((f) => f())
}

export function test() {
    define_tests()
    UT.run()
}
if (typeof require !== 'undefined' && require.main === module) {
    test();
}