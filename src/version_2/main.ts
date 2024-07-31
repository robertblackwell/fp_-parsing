import {Ast} from "../ast_functions"
import * as Tree from "../tree"
import * as ST from "../simple_test/simple_test"
import * as Maybe from "../version_2/maybe_v2"
import {
    Parser, 
    ParserResult, 
    PReturnObj,
    makeJustParserResult,
    bindM2, bind, eta
} from "../version_2/parser_monad"
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
} from "../version_2/primitives"
import {
    expression, 
    term_plus_expression_1,
    factor, factor_times_term_1,
    parseNumberExp, parseBracketExp
} from "../version_2/expression_parser"
type TNode = Tree.TreeNode
/******************************************************************************/
// Tests 
/*******************************************************************************/
import {sameParserResult} from "./parser_monad"
ST.describe("test_factor", () => {
    {
        const r1 = factor(" 2")
        ST.assert.isTrue(!Maybe.isNothing(r1))
        if(!Maybe.isNothing(r1)) {
            const {result: r1_1, remaining: r1_2} = Maybe.getValue(r1)
            ST.assert.isTrue(Tree.treeAsString(r1_1) === "2")
            ST.assert.isTrue(r1_2 == "")
        } else {
            ST.assert.isTrue(false)
        }
    }
    {
        const r1 = factor(" 2345")
        if(!Maybe.isNothing(r1)) {
            const {result: r1_1, remaining: r1_2} = Maybe.getValue(r1)
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
            Maybe.nothing())
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
    sameParserResult("test a number ''", parseNumberExp(""), Maybe.nothing())
    sameParserResult("aaa", parseNumberExp("aaa"), Maybe.nothing())
    sameParserResult("1", parseNumberExp("1"), makeJustParserResult(Tree.NumberNode.make(1), ""))
    sameParserResult("123", parseNumberExp("123"), makeJustParserResult(Tree.NumberNode.make(123), ""))
    sameParserResult("123 ", parseNumberExp("123 "), makeJustParserResult(Tree.NumberNode.make(123), " "))
    sameParserResult("123X", parseNumberExp("123X "), makeJustParserResult(Tree.NumberNode.make(123), "X"))
    sameParserResult("  123X ", parseNumberExp("  123X "), makeJustParserResult(Tree.NumberNode.make(123), "X "))
})
ST.describe("test_expr", () => {
    function test_one(expression_str: string)
    {
        console.log(`testing string ${expression_str}`)
        const res1 = expression(expression_str)
        let string_rep = ""
        let remstr = ""
        if(Maybe.isNothing(res1)) {
            string_rep = "nothing"
        } else {
            const {result: r, remaining: rem} = Maybe.getValue(res1)
            string_rep = Tree.treeAsString(r)
            remstr = rem
        }
        console.log(`input ${expression_str} maybe_result ${string_rep} rem: ${remstr} \n`)
    }
    sameParserResult("", expression("1 + 2"), makeJustParserResult(Tree.AddNode.make(Tree.NumberNode.make(1), Tree.NumberNode.make(2)),""))
    sameParserResult("", expression("2 * 3"), makeJustParserResult(Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)),""))
    sameParserResult("", expression(" 1 + 2"), makeJustParserResult(Tree.AddNode.make(Tree.NumberNode.make(1), Tree.NumberNode.make(2)),""))
    sameParserResult("", expression(" 2 * 3"), makeJustParserResult(Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)),""))
    sameParserResult("", expression("2*(3 + 4)"), 
        makeJustParserResult(
            Tree.MultNode.make(
                Tree.NumberNode.make(2), 
                Tree.BracketNode.make(
                    Tree.AddNode.make(
                            Tree.NumberNode.make(3), Tree.NumberNode.make(4)
                    )
                )
            )
            ,""))

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
    sameParserResult("", expression("2*(3 + 4) + 3 + 4* 5"), makeExpectedParserResult())
    sameParserResult("", expression(" 2*(3+4) + 3+4* 5"), makeExpectedParserResult())
    sameParserResult("", expression(" 2*(3+4)+ 3+4* 5"), makeExpectedParserResult())
})

ST.run()

//@ignore_end
//@file_end