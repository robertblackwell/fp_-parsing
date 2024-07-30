import {Ast} from "../ast_functions"
import * as Tree from "../tree"
import * as Maybe from "./maybe_v2"
import {
    Parser, 
    ParserResult, 
    PReturnObj,
    makeJustParserResult,
    bindM2, bind, eta
} from "./parser_monad"
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
} from "./primitives"
import {
    expression, 
    term_plus_expression_1,
    factor, factor_times_term_1,
    parseNumberExp, parseBracketExp
} from "./expression_parser"
type TNode = Tree.TreeNode
/******************************************************************************/
// Tests 
/*******************************************************************************/
// function always<T>(sinput:string):ParserResult<T[]> {
//     // return Maybe.nothing()
//     return makeJustParserResult<T[]>([], sinput)
// }
// function many<T>(single: Parser<T>): Parser<T[]> {
//     return function(sinput: string): ParserResult<T[]> {
//         return choice<T[], T[]>(many1(single), always)(sinput)
//     }
// }
// function many1<T>(single: Parser<T>): Parser<T[]> {
//     const ms: Parser<T[]> = many(single)
//     return function(sinput: string)  { 
//         return bindM2<T, T[], T[]>(single, ms, (t:T, ts: T[]) => {
//             const x = eta([...[t], ...ts])
//             return x
//         })(sinput)
//     }
// }

    // this is the main module
    function verify_parser_result(actual: ParserResult<TNode>, expected: ParserResult<TNode>) {
        // const {maybe_result: r1, remaining: rem1} = actual
        // const {maybe_result: r2, remaining: rem2} = expected
        // console.log(`actual rem: ${rem1} expected rem: ${rem2}`)
        if( ((!Maybe.isNothing(actual) && Maybe.isNothing(expected)) || (Maybe.isNothing(actual) && !Maybe.isNothing(expected)))) {
            console.log(`failed disagree re isNothing()`)
        }
        if((!Maybe.isNothing(actual) && !Maybe.isNothing(expected))) {
        const {result: r1, remaining: rem1}: PReturnObj<Ast> = Maybe.getValue(actual)
        const {result: r2, remaining: rem2}: PReturnObj<Ast> = Maybe.getValue(expected)
        const s1 = Tree.treeAsString(r1)
        const s2 = Tree.treeAsString(r2)
        console.log(`actual exp: ${s1} expected exp: ${s2}`)
        }
    }
    function test_parser() {
        test_factor_times_term()
        test_term_plus_expression()
        // test_add()
        test_whitespace()
        test_anumber() 
    }
    function test_factor() {
        const r1 = factor(" 2")
        const r2 = factor(" 2345")
    }
    function test_factor_times_term() {

        verify_parser_result(
            factor_times_term_1("2 + 3"),
            Maybe.nothing())

        verify_parser_result(
            factor_times_term_1("2 * 3"), 
            makeJustParserResult(
                Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
            "")
        )
        verify_parser_result(
            factor_times_term_1("2 * 3"), 
            makeJustParserResult(
                Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
                ""
            )
        )
    }
    function test_term_plus_expression() {
        verify_parser_result(
            term_plus_expression_1(" 2 + 3"),
            makeJustParserResult(
                Tree.AddNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3)), 
                ""
            )
        )
    }
    function testMany() {
        const digitParser = createPredicateParser((ss: string) => (ss.substring(0, 1).match(/[0-9]/g) !== null))
        const z = many(digitParser)
        const rr = z("12345")
        if(Maybe.isNothing(rr)) {
            console.log(["many digits of '12345", "nothing"])
        } else {
            const {result: a, remaining:b} = Maybe.getValue(rr)
            console.log(["many digits of '12345'", a, b])
        }
        const z2 = create_OneOrMoreParser_3(digitParser)
        const rr2 = z2("12345x")
        if(Maybe.isNothing(rr2)) {
            console.log(["many digits of '12345", "nothing"])
        } else {
            const {result: a, remaining:b} = Maybe.getValue(rr2)
            console.log(["many digits of '12345'", a, b])
        }
    }
    function test_whitespace() {
        let ss = " 1234"
        const ss2 = removeLeadingWhitespace(ss)
        const r1 = removeLeadingWhitespace("")
        const r2 = removeLeadingWhitespace("  ff")
        const r3 = removeLeadingWhitespace("hh")
    }
    function test_anumber() {
        const r1 = parseNumberExp("")
        const r2 = parseNumberExp("aaa")
        const r3 = parseNumberExp("1")
        const r4 = parseNumberExp("123")
        const r5 = parseNumberExp("123 ")
        const r6 = parseNumberExp("123X ")
        const r7 = parseNumberExp("  123X ")
    }
    function test_expr() {
        function test_one(expression_str: string)
        {
            console.log(`testing string ${expression_str}`)
            const res1 = expression(expression_str)
            let string_rep = ""
            let remstr = ""
            if(Maybe.isNothing(res1)) {
                string_rep = "nothing"
            } else {
                const {result: r, remaining: rem}: PReturnObj<Ast> = Maybe.getValue(res1)
                string_rep = Tree.treeAsString(r)
                remstr = rem
            }
            console.log(`input ${expression_str} maybe_result ${string_rep} rem: ${remstr} \n`)
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
if (typeof module !== 'undefined' && !module.parent) {
    // test_factor()
    // test_parser()
    testMany()
    test_factor_times_term()
    test_term_plus_expression()
    test_whitespace()
    test_anumber()
    test_expr()
}
//@ignore_end
//@file_end