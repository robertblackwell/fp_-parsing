//@file_start expression_parser_version_1.md
//@markdown_start
/*
In this section we detail the code for version one of our expression parser.

This is a version that makes almost no explicit use of `Functors`, `Applicatives` and `Monads`.

The section starts with some usual TS preliminaries, such as import statments and some
type definitions
*/
//@markdown_end
//@code_start
import * as Tree from "../src/tree"
import {
    Parser, 
    ParserResult, 
    makeParserResult,
    followedBy3, 
    parseNumber, 
    whitespaceIfy, 
    createPredicateParser,
} from "../src/parsing_intro"
import * as Maybe from "../src/maybe_v1"

type TNode = Tree.TreeNode
//@code_end
//@markdown_start
/*
# Parse and expression
## expression ::= term + expression | term

Below we define a parser for `expression` which closely parallels the __BNF__ definition of an expression.
```
exp ::= term + expression | term
```
Notice there are 2 implementations of the function `term_plus_expression`  

*/
//@markdown_end
//@code_start
function expression(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const r = choice([term_plus_expression_1, term_only], s)
    return r
}
function term_plus_expression_1(sinput: string): ParserResult<TNode> {
    const s  = removeLeadingWhitespace(sinput)
    const {maybe_result: r1, remaining: rem1} = term(s)
    if(Maybe.isNothing(r1) || (rem1.length === 0)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const v1 = Maybe.getValue(r1)
    const {maybe_result: r2, remaining: rem2} = parseAdditionSign(rem1)
    if(Maybe.isNothing(r2)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const v2: string = Maybe.getValue(r2)
    let {maybe_result: r3, remaining: rem3} = expression(rem2)
    if(Maybe.isNothing(r3)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const v3 = Maybe.getValue(r3)
    if(v1 === null || v3 === null) {
        throw Error("") ///@todo - fix this
    }
    let newast = Tree.AddNode.make(v1, v3)
    return makeParserResult(Maybe.just(newast), rem3)
}
function term_plus_expression_2(sinput: string): ParserResult<TNode> {
    function add(left: TNode, op: string,  right: TNode): TNode {
        let newast = Tree.AddNode.make(left, right)
        return newast
    } 
    return followedBy3(term, parseAdditionSign, expression, add)(sinput)
}
function term_only(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const {maybe_result: r, remaining: rem} = term(s)
    if(Maybe.isNothing(r)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const v = Maybe.getValue(r)
    return makeParserResult(Maybe.just(v), rem)
}
//@code_end
//@markdown_start
/*
## term ::= factor * term | factor

Again notice that there are 2 implementations of `factor_times_term
*/
//@markdown_end
//@code_start
function term(sinput: string): ParserResult<TNode> {
    const rr = choice([factor_times_term_1, factor_only], sinput)
    return rr
}
function factor_times_term_1(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    let {maybe_result: r1, remaining: rem1} = factor(s)
    if(Maybe.isNothing(r1)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const {maybe_result: r2, remaining: rem2} = parseMultiplySign(rem1)
    if(Maybe.isNothing(r2)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    let {maybe_result: r3, remaining: rem3} = term(rem2)
    if(Maybe.isNothing(r3)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    let left = Maybe.getValue(r1)
    let right = Maybe.getValue(r3)
    let newnode = Tree.MultNode.make(left, right)
    return makeParserResult(Maybe.just(newnode), rem3)
}
function factor_times_term_2(sinput: string): ParserResult<TNode> {
    function f(left: TNode, op: string, right: TNode): TNode {
        let newnode = Tree.MultNode.make(left, right)
        return newnode
    } 
    const rr = followedBy3(factor, parseMultiplySign, term, f)(sinput)
    return rr
}
function factor_only(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    let {maybe_result: r, remaining: rem} = factor(s)
    if(Maybe.isNothing(r)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    return makeParserResult(r, rem)
}
//@code_end
//@markdown_start
/*
## factor ::= number  | (expression)
*/
//@markdown_end
//@code_start
function factor(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    return choice([parseNumberExp, parseBracketExp], s)
}
function parseBracketExp(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const {maybe_result: r1, remaining: rem1} = parseOpenBracket(s)
    if(Maybe.isNothing(r1)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const {maybe_result: r2, remaining: rem2} = expression(rem1)
    if(Maybe.isNothing(r2)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const {maybe_result: r3, remaining: rem3} = parseCloseBracket(rem2)
    if(Maybe.isNothing(r3)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const n = Maybe.getValue(r2)
    const rnode = Tree.BracketNode.make(n)
    return makeParserResult(Maybe.just(rnode), rem3)
}

function parseNumberExp(sinput: string) : ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const {maybe_result: r1, remaining: rem1} = parseNumber(s)
    if(Maybe.isNothing(r1)) {
        return makeParserResult(Maybe.nothing(), sinput)
    }
    const node = Tree.NumberNode.make(parseInt(Maybe.getValue(r1)))
    return makeParserResult(Maybe.just(node), rem1)
}
//@code_end
//@markdown_start
/*
## Primitive Parsers 
*/
//@markdown_end
//@code_start
const parseAdditionSign = whitespaceIfy(createPredicateParser((s) => (s === "+")))
const parseMultiplySign = whitespaceIfy(createPredicateParser((s) => (s === "*")))
const parseOpenBracket = whitespaceIfy(createPredicateParser((s) => (s === "(")))
const parseCloseBracket = whitespaceIfy(createPredicateParser((s) => (s === ")")))
function removeLeadingWhitespace(s: string): string {
    if((s.length > 0) && (s.substring(0, 1) == " ")) {
        return removeLeadingWhitespace(s.slice(1))
    }
    return s.slice(0)
}
//@code_end
//@markdown_start
/*
## More ways of combining parsers*/
//@markdown_end
//@code_start
/** 
 * Alternative - try each parser in order, on the original input, and return the result of the first that succeeds
*/
const choice = parser_or
function parser_or(ps: Array<Parser<TNode>>, input: string): ParserResult<TNode> {
    if(ps.length == 0) {
        return makeParserResult(Maybe.nothing(), input)
    }
    const {maybe_result: r1, remaining: rem1} = ps[0](input)
    if(Maybe.isNothing(r1)) {
        return parser_or(ps.slice(1), input)
    }
    return makeParserResult(Maybe.just(Maybe.getValue(r1)), rem1)
}
//@code_end
//@ignore_start
/******************************************************************************/
// Tests 
/*******************************************************************************/
    // this is the main module
    function verify_parser_result(actual: ParserResult<TNode>, expected: ParserResult<TNode>) {
        const {maybe_result: r1, remaining: rem1} = actual
        const {maybe_result: r2, remaining: rem2} = expected
        console.log(`actual rem: ${rem1} expected rem: ${rem2}`)
        if( ((!Maybe.isNothing(r1) && Maybe.isNothing(r2)) || (Maybe.isNothing(r1) && !Maybe.isNothing(r2)))) {
            console.log(`failed disagree re isNothing()`)
        }
        if((!Maybe.isNothing(r1) && !Maybe.isNothing(r2))) {
            const s1 = Tree.treeAsString(Maybe.getValue(r1))
            const s2 = Tree.treeAsString(Maybe.getValue(r2))
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
            makeParserResult(Maybe.nothing(), "2 + 3"))

        verify_parser_result(
            factor_times_term_2("2 + 3"),
            makeParserResult(Maybe.nothing(), "2 + 3"))

        verify_parser_result(
            factor_times_term_1("2 * 3"), 
            makeParserResult(
                Maybe.just(
                Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3))), 
            ""
        ))
        verify_parser_result(
            factor_times_term_1("2 * 3"), 
            makeParserResult(
                Maybe.just(
                Tree.MultNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3))), 
                ""
            )
        )
    }
    function test_term_plus_expression() {
        verify_parser_result(
            term_plus_expression_1(" 2 + 3"),
            makeParserResult(
                Maybe.just(
                Tree.AddNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3))), 
                ""
            )
        )
        verify_parser_result(
            term_plus_expression_2(" 2 + 3"),
            makeParserResult(
                Maybe.just(
                Tree.AddNode.make(Tree.NumberNode.make(2), Tree.NumberNode.make(3))), 
                ""
            )
        )
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
            const {maybe_result: r, remaining: rem} = expression(expression_str)
            let string_rep = ""
            if(Maybe.isNothing(r)) {
                string_rep = "nothing"
            } else {
                string_rep = Tree.treeAsString(Maybe.getValue(r))
            }
            console.log(`input ${expression_str} maybe_result ${string_rep} rem: ${rem} \n`)
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
    test_factor_times_term()
    test_term_plus_expression()
    test_whitespace()
    test_anumber()
    test_expr()
}
//@ignore_end
//@file_end