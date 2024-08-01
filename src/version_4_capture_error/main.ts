import {Ast} from "../ast_functions"
import * as Tree from "../tree"
import * as ST from "../simple_test/simple_test"
import * as Result from "../version_4_capture_error/result_monad"
import {
    Parser, 
    ParserResult, 
    PReturnObj,
    makeParserResult,
    makeFailedParserResult,
    bindM2, bind, eta
} from "../version_4_capture_error/parser_monad"
import {
    parseNumber, 
    whitespaceIfy, 
    choice, choiceN,
    many, many1,
    createPredicateParser,
    stripLeadingWhitespace, 
    removeLeadingWhitespace,
    create_OneOrMoreParser_3,
    followedBy, followedBy3
} from "../version_4_capture_error/primitives"
import {
    expression, 
    term_plus_expression,
    factor, factor_times_term,
    parseNumberExp, parseBracketExp
} from "../version_4_capture_error/expression_parser_2"
type TNode = Tree.TreeNode
/******************************************************************************/
// Tests 
/*******************************************************************************/
import {sameParserResult} from "./parser_monad"
ST.describe("test_factor", () => {
    {
        const r1 = parseNumber("2")
        ST.assert.isTrue(!Result.isFailedResult(r1))
        if(!Result.isFailedResult(r1)) {
            const {result: r1_1, remaining: r1_2} = Result.getValue(r1)
            ST.assert.isTrue(r1_1 === "2")
            ST.assert.isTrue(r1_2 == "")
        } else {
            ST.assert.isTrue(false)
        }
    }
    {
        const r1 = parseNumber("23")
        ST.assert.isTrue(!Result.isFailedResult(r1))
        if(!Result.isFailedResult(r1)) {
            const {result: r1_1, remaining: r1_2} = Result.getValue(r1)
            ST.assert.isTrue(r1_1 === "23")
            ST.assert.isTrue(r1_2 == "")
        } else {
            ST.assert.isTrue(false)
        }
    }

    {
        const r1 = factor(" 2")
        ST.assert.isTrue(!Result.isFailedResult(r1))
        if(!Result.isFailedResult(r1)) {
            const {result: r1_1, remaining: r1_2} = Result.getValue(r1)
            ST.assert.isTrue(Tree.treeAsString(r1_1) === "2")
            ST.assert.isTrue(r1_2 == "")
        } else {
            ST.assert.isTrue(false)
        }
    }
    {
        const r1 = factor(" 2345")
        ST.assert.isTrue(!Result.isFailedResult(r1))
        if(!Result.isFailedResult(r1)) {
            const {result: r1_1, remaining: r1_2} = Result.getValue(r1)
            const tass = Tree.treeAsString(r1_1)
            ST.assert.isTrue(Tree.treeAsString(r1_1) === "2345")
            ST.assert.isTrue(r1_2 == "")
        } else {
            ST.assert.isTrue(false)
        }
    }
})
ST.describe("test parsers", () => {

    ST.assert.isTrue(
        sameParserResult("factor_times_term(\"2 + 3\")",
            factor_times_term("2 + 3"),
            makeFailedParserResult("predicate_parser","+ 3"))
    )

    ST.assert.isTrue(
        sameParserResult("factor_times_term_1(\"2 * 3\")",
            factor_times_term("2 * 3"), 
            makeParserResult(
            Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
            "")
        )
    )
    ST.assert.isTrue(
        sameParserResult("factor_times_term_1(\"2 * 3\")",
            factor_times_term("2 * 3"), 
            makeParserResult(
                Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
                ""
            )
        )
    )
})
ST.describe("test_term_plus_expression", () => {
    ST.assert.isTrue(
        sameParserResult("term_plus_expression_1(\"2 + 3\")",
            term_plus_expression(" 2 + 3"),
            makeParserResult(
                Tree.AddNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
                ""
            )
        )
    )
})

ST.describe("test_whitespace", () => {
    let ss = " 1234"
    ST.assert.isTrue("1234" == removeLeadingWhitespace(ss))
    ST.assert.isTrue("" ==  removeLeadingWhitespace(""))
    ST.assert.isTrue("ff" ==  removeLeadingWhitespace("  ff"))
    ST.assert.isTrue("hh" ==  removeLeadingWhitespace("hh"))
})
ST.describe("test_anumber", () => {
    ST.assert.isTrue(sameParserResult("test a number ''", parseNumberExp(""), makeFailedParserResult("predicate_parser","")))
    ST.assert.isTrue(sameParserResult("aaa", parseNumberExp("aaa"), makeFailedParserResult("predicate_parser","aaa")))
    ST.assert.isTrue(sameParserResult("1", parseNumberExp("1"), makeParserResult(Tree.NumberNode.make(1), "")))
    ST.assert.isTrue(sameParserResult("123", parseNumberExp("123"), makeParserResult(Tree.NumberNode.make(123), "")))
    ST.assert.isTrue(sameParserResult("123 ", parseNumberExp("123 "), makeParserResult(Tree.NumberNode.make(123), " ")))
    ST.assert.isTrue(sameParserResult("123X", parseNumberExp("123X "), makeParserResult(Tree.NumberNode.make(123), "X")))
    ST.assert.isTrue(sameParserResult("  123X ", parseNumberExp("  123X "), makeParserResult(Tree.NumberNode.make(123), "X ")))
})
ST.describe("test_expr", () => {
    ST.assert.isTrue(sameParserResult("", expression("1 + 2"), makeParserResult(Tree.AddNode.make(Tree.NumberNode.make(1), Tree.NumberNode.make(2)),"")))
    ST.assert.isTrue(sameParserResult("", expression("2 * 3"), makeParserResult(Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)),"")))
    ST.assert.isTrue(sameParserResult("", expression(" 1 + 2"), makeParserResult(Tree.AddNode.make(Tree.NumberNode.make(1), Tree.NumberNode.make(2)),"")))
    ST.assert.isTrue(sameParserResult("", expression(" 2 * 3"), makeParserResult(Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)),"")))
    ST.assert.isTrue(sameParserResult("", expression("2*(3 + 4)"), 
        makeParserResult(
            Tree.MultNode.make(
                Tree.NumberNode.make(2), 
                Tree.BracketNode.make(
                    Tree.AddNode.make(
                            Tree.NumberNode.make(3), Tree.NumberNode.make(4)
                    )
                )
            )
            ,"")))

    const makeExpectedParserResult = () => {
        return makeParserResult(
            Tree.AddNode.make(
                Tree.AddNode.make(
                    Tree.MultNode.make(
                        Tree.NumberNode.make(2),
                        Tree.BracketNode.make(
                            Tree.AddNode.make(
                                Tree.NumberNode.make(3), Tree.NumberNode.make(4)
                            )
                        )
                    ),
                    Tree.NumberNode.make(3)
                ),
                Tree.MultNode.make(
                    Tree.NumberNode.make(4), Tree.NumberNode.make(5)
                )
            ), "")
    }        
    ST.assert.isTrue(sameParserResult("", expression("2*(3 + 4) + 3 + 4* 5"), makeExpectedParserResult()))
    ST.assert.isTrue(sameParserResult("", expression(" 2*(3+4) + 3+4* 5"), makeExpectedParserResult()))
    ST.assert.isTrue(sameParserResult("", expression(" 2*(3+4)+ 3+4* 5"), makeExpectedParserResult()))
})

ST.run()

//@ignore_end
//@file_end