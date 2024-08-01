import {Ast} from "../ast_functions"
import * as Tree from "../tree"
import * as ST from "../simple_test/simple_test"
import {
    ParserResult, 
    makeJustParserResult,
} from "../version_3/parser_monad"
import {
    many,
    createPredicateParser,
    removeLeadingWhitespace,
    create_OneOrMoreParser_3,
} from "../version_3/primitives"
import {
    expression, 
    term_plus_expression_1,
    factor, factor_times_term_1,
    parseNumberExp,
} from "../version_3/expression_parser"
type TNode = Tree.TreeNode
/******************************************************************************/
// Tests 
/*******************************************************************************/
import {sameParserResult} from "./parser_monad"

ST.describe("test_factor", () => {
    {
        const r1 = factor(" 2")
        ST.assert.isTrue(r1 !== null)
        if(r1 !== null) {
            const [r1_1, r1_2] = r1
            ST.assert.isTrue(Tree.treeAsString(r1_1) === "2")
            ST.assert.isTrue(r1_2 == "")
        } else {
            ST.assert.isTrue(false)
        }
    }
    {
        const r1 = factor(" 2345")
        ST.assert.isTrue(r1 !== null)
        if(r1 !== null) {
            const [r1_1, r1_2] = r1
            ST.assert.isTrue(Tree.treeAsString(r1_1) === "2345")
            ST.assert.isTrue(r1_2 == "")
        } else {
            ST.assert.isTrue(false)
        }
    }
})
ST.describe("test parsers", () => {

    ST.assert.isTrue(
        sameParserResult("factor_times_term_1(\"2 + 3\")",
            factor_times_term_1("2 + 3"),
            null)
    )

    ST.assert.isTrue(
        sameParserResult("factor_times_term_1(\"2 * 3\")",
            factor_times_term_1("2 * 3"), 
            makeJustParserResult(
            Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
            "")
        )
    )
    ST.assert.isTrue(
        sameParserResult("factor_times_term_1(\"2 * 3\")",
            factor_times_term_1("2 * 3"), 
            makeJustParserResult(
                Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
                ""
            )
        )
    )
})
ST.describe("test_term_plus_expression", () => {
    ST.assert.isTrue(
        sameParserResult("term_plus_expression_1(\"2 + 3\")",
            term_plus_expression_1(" 2 + 3"),
            makeJustParserResult(
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
    ST.assert.isTrue(sameParserResult("test a number ''", parseNumberExp(""), null))
    ST.assert.isTrue(sameParserResult("aaa", parseNumberExp("aaa"), null))
    ST.assert.isTrue(sameParserResult("1", parseNumberExp("1"), makeJustParserResult(Tree.NumberNode.make(1), "")))
    ST.assert.isTrue(sameParserResult("123", parseNumberExp("123"), makeJustParserResult(Tree.NumberNode.make(123), "")))
    ST.assert.isTrue(sameParserResult("123 ", parseNumberExp("123 "), makeJustParserResult(Tree.NumberNode.make(123), " ")))
    ST.assert.isTrue(sameParserResult("123X", parseNumberExp("123X "), makeJustParserResult(Tree.NumberNode.make(123), "X")))
    ST.assert.isTrue(sameParserResult("  123X ", parseNumberExp("  123X "), makeJustParserResult(Tree.NumberNode.make(123), "X ")))
})
ST.describe("test_expr", () => {
    ST.assert.isTrue(sameParserResult("", expression("1 + 2"), makeJustParserResult(Tree.AddNode.make(Tree.NumberNode.make(1), Tree.NumberNode.make(2)),"")))
    ST.assert.isTrue(sameParserResult("", expression("2 * 3"), makeJustParserResult(Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)),"")))
    ST.assert.isTrue(sameParserResult("", expression(" 1 + 2"), makeJustParserResult(Tree.AddNode.make(Tree.NumberNode.make(1), Tree.NumberNode.make(2)),"")))
    ST.assert.isTrue(sameParserResult("", expression(" 2 * 3"), makeJustParserResult(Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)),"")))
    ST.assert.isTrue(sameParserResult("", expression("2*(3 + 4)"), 
        makeJustParserResult(
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
        return makeJustParserResult(
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