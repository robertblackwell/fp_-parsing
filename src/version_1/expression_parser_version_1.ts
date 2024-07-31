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
import * as Tree from "../../src/tree"
import * as Maybe from "../version_1/maybe_v1"
import {
    Parser, 
    ParserResult, 
    makeJustParserResult,
    followedBy3, 
    parseNumber, 
    whitespaceIfy, 
    createPredicateParser,
} from "../version_1/parsing_intro"

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
export function expression(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const r = choiceN([term_plus_expression_1, term_only], s)
    return r
}
export function term_plus_expression_1(sinput: string): ParserResult<TNode> {
    const s  = removeLeadingWhitespace(sinput)
    const res1 = term(s)
    if(Maybe.isNothing(res1)) {
        return Maybe.nothing()
    }
    const {result: r1, remaining: rem1}  = Maybe.getValue(res1)
    const res2 = parseAdditionSign(rem1)
    if(Maybe.isNothing(res2)) {
        return Maybe.nothing()
    }
    const {result: r2, remaining: rem2}  = Maybe.getValue(res2)
    let res3 = expression(rem2)
    if(Maybe.isNothing(res3)) {
        return Maybe.nothing()
    }
    let {result: r3, remaining: rem3} = Maybe.getValue(res3)
    if(r1 === null || r3 === null) {
        throw Error("") ///@todo - fix this
    }
    let newast = Tree.AddNode.make(r1, r3)
    return makeJustParserResult(newast, rem3)
}
export function term_plus_expression_2(sinput: string): ParserResult<TNode> {
    function add(left: TNode, op: string,  right: TNode): TNode {
        let newast = Tree.AddNode.make(left, right)
        return newast
    } 
    return followedBy3(term, parseAdditionSign, expression, add)(sinput)
}
export function term_only(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = term(s)
    if(Maybe.isNothing(res1)) {
        return Maybe.nothing()
    }
    const {result: r, remaining: rem}  = Maybe.getValue(res1)
    return makeJustParserResult(r, rem)
}
//@code_end
//@markdown_start
/*
## term ::= factor * term | factor

Again notice that there are 2 implementations of `factor_times_term
*/
//@markdown_end
//@code_start
export function term(sinput: string): ParserResult<TNode> {
    const rr = choiceN([factor_times_term_1, factor_only], removeLeadingWhitespace(sinput))
    return rr
}
export function factor_times_term_1(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = factor(s)
    if(Maybe.isNothing(res1)) {
        return Maybe.nothing()
    }
    const {result: r1, remaining: rem1} = Maybe.getValue(res1)
    const res2 = parseMultiplySign(rem1)
    if(Maybe.isNothing(res2)) {
        return Maybe.nothing()
    }
    const {result: r2, remaining: rem2} = Maybe.getValue(res2)
    const res3 = term(rem2)
    if(Maybe.isNothing(res3)) {
        return Maybe.nothing()
    }
    const {result: r3, remaining: rem3} = Maybe.getValue(res3)
    let left = r1
    let right = r3
    let newnode = Tree.MultNode.make(left, right)
    return makeJustParserResult(newnode, rem3)
}
export function factor_times_term_2(sinput: string): ParserResult<TNode> {
    function f(left: TNode, op: string, right: TNode): TNode {
        let newnode = Tree.MultNode.make(left, right)
        return newnode
    } 
    const rr = followedBy3(factor, parseMultiplySign, term, f)(sinput)
    return rr
}
export function factor_only(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = factor(s)
    if(Maybe.isNothing(res1)) {
        return Maybe.nothing()
    }
    let {result: r, remaining: rem} = Maybe.getValue(res1)
    return makeJustParserResult(r, rem)
}
//@code_end
//@markdown_start
/*
## factor ::= number  | (expression)
*/
//@markdown_end
//@code_start
export function factor(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    return choiceN([parseNumberExp, parseBracketExp], s)
}
export function parseBracketExp(sinput: string): ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = parseOpenBracket(s)
    if(Maybe.isNothing(res1)) {
        return Maybe.nothing()
    }
    const {result: r1, remaining: rem1} = Maybe.getValue(res1)
    const res2 = expression(rem1)
    if(Maybe.isNothing(res2)) {
        return Maybe.nothing()
    }
    const {result: r2, remaining: rem2} = Maybe.getValue(res2)
    const res3 = parseCloseBracket(rem2)
    if(Maybe.isNothing(res3)) {
        return Maybe.nothing()
    }
    const {result: r3, remaining: rem3} = Maybe.getValue(res3)
    const n = r2
    const rnode = Tree.BracketNode.make(n)
    return makeJustParserResult((rnode), rem3)
}

export function parseNumberExp(sinput: string) : ParserResult<TNode> {
    const s = removeLeadingWhitespace(sinput)
    const res1 = parseNumber(s)
    if(Maybe.isNothing(res1)) {
        return Maybe.nothing()
    }
    const {result: r1, remaining: rem1} = Maybe.getValue(res1)
    const node = Tree.NumberNode.make(parseInt(r1))
    return makeJustParserResult((node), rem1)
}
//@code_end
//@markdown_start
/*
## Primitive Parsers 
*/
//@markdown_end
//@code_start
export const parseAdditionSign = whitespaceIfy(createPredicateParser((s) => (s === "+")))
export const parseMultiplySign = whitespaceIfy(createPredicateParser((s) => (s === "*")))
export const parseOpenBracket = whitespaceIfy(createPredicateParser((s) => (s === "(")))
export const parseCloseBracket = whitespaceIfy(createPredicateParser((s) => (s === ")")))

export function removeLeadingWhitespace(s: string): string {
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
export const choiceN = parser_or
function parser_or(ps: Array<Parser<TNode>>, input: string): ParserResult<TNode> {
    if(ps.length == 0) {
        return Maybe.nothing()
    }
    const res1 = ps[0](input)
    if(Maybe.isNothing(res1)) {
        return parser_or(ps.slice(1), input)
    }
    const {result: r1, remaining: rem1} = Maybe.getValue(res1)
    return makeJustParserResult((r1), rem1)
}
//@code_end
//@ignore_start


//@ignore_end
//@file_end