import * as Tree from "./tree"
import {treeAsNumber, treeAsString} from "./walker"
type Ast = Tree.TreeNode | null

type ParserResult = {ast: Ast, rem: string}

function make_result(ast: Ast, rem: string) {
    return {ast, rem}
}

type Parser = (s: string) => ParserResult

function isDone(r: ParserResult): boolean {
    return (r.rem.length == 0)
}
function failed(r: ParserResult): boolean {
    return (r.ast == null)
}

function expression(sinput: string): ParserResult {
    const s = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(failed(t) || isDone(t)) {
        return t
    }
    const tnode = t.ast as Tree.TreeNode

    const plus = movePastPlusChar(t.rem)
    if(plus == t.rem) {
        return t
    }
    const rest: string = plus as string
    let exp = expression(plus)
    if(failed(exp)) {
        return make_result(null, plus)
    }
    const expnode = exp.ast as Tree.TreeNode
    let newast = Tree.AddNode.make(tnode, expnode)

    return make_result(newast, exp.rem)
}

function term(sinput: string): ParserResult {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(failed(fac) || isDone(fac)) {
        return fac
    }
    let fnode = fac.ast as Tree.TreeNode
    const mult = movePastMultChar(fac.rem)
    if(mult == fac.rem) {
        return fac
    }
    const rest: string = mult as string
    let t = term(mult)
    if(failed(t)) {
        return {ast: null, rem: rest}
    }
    let tnode = t.ast as Tree.TreeNode
    return make_result(Tree.MultNode.make(fnode, tnode), t.rem)
}

function factor_old(sinput: string): ParserResult {
    const s = removeLeadingWhitespace(sinput)
    const nn = anumber(s)
    if(failed(nn)) {
        const brack = bracket(s)
        if(failed(brack)) {
            return make_result (null, s)
        }
        const bnode = brack.ast as Tree.TreeNode
        return make_result(bnode, brack.rem)
    }
    return nn
}

function factor(sinput: string): ParserResult {
    const s = removeLeadingWhitespace(sinput)
    return parser_or([anumber, bracket], s)
}

function bracket(s: string): ParserResult {

    if(s.substring(0,1) != "(") {
        return {ast: null, rem:s}
    }
    const exp = expression(s.slice(1))
    if(failed(exp)) {
        return make_result(null, s.slice(1))
    }
    if(exp.rem.substring(0,1) != ")") {
        return make_result(null, exp.rem.slice(0))
    }
    const rem = exp.rem.slice(1)
    const newexpnode = exp.ast as Tree.TreeNode
    const rnode = Tree.BracketNode.make(newexpnode)
    return make_result(rnode, rem)
}

function anumber(s: string) : ParserResult {

    function isDigit(char: string) {
        return (char.length == 1) && (/^\d$/.test(char))
    }
    function extractNumber(str: string): {numstr: string, rem: string} {
        if(str.length == 0) {
            return {numstr:"", rem: ""}
        }
        const ch = str.substring(0,1)
        if(isDigit(ch)) {
            let {numstr, rem} = extractNumber(str.slice(1))
            return {numstr: ch+numstr, rem}
        } else {
            return {numstr: "", rem: str}
        } 
    }
    let {numstr, rem} = extractNumber(s)
    if(numstr == "") {
        return {ast: null, rem: s}
    } else {
        const numnode = Tree.NumberNode.make(parseInt(numstr))
        return make_result(numnode, rem)
    }
}
/**
 * Move past the expected "+" sign. 
 * Advances the string if successfull
 * returns the input string if failed
 */
function movePastPlusChar(s: string): string {
    let s2 = removeLeadingWhitespace(s)
    if(s2.substring(0, 1) == "+") {
        return removeLeadingWhitespace(s2.substring(1))
    }
    return s
}
/**
 * Move past the expected "*" sign. 
 * Advances the string if successfull
 * returns the input string if failed
 */
function movePastMultChar(s: string): string {
    let s2 = removeLeadingWhitespace(s)
    if(s2.substring(0, 1) == "*") {
        return removeLeadingWhitespace(s2.substring(1))
    }
    return s
}
/**
 * Move past the expected "*" sign. 
 * Advances the string if successfull
 * returns the input string if failed
 */
function movePastChar(ch: string, s: string): string {
    let s2 = removeLeadingWhitespace(s)
    if(s2.substring(0, 1) == ch) {
        return removeLeadingWhitespace(s2.substring(1))
    }
    return s
}

function removeLeadingWhitespace(s: string): string {
    if((s.length > 0) && (s.substring(0, 1) == " ")) {
        return removeLeadingWhitespace(s.slice(1))
    }
    return s.slice(0)
}

/**
 * This function applies p1 and if it succedds returns its result 
 * if p1 fails p2 is applied 
 */
function parser_or2(p1: Parser, p2: Parser, input: string): ParserResult {
    return parser_or([p1, p2], input)
    // const r1 = p1(input)
    // if(failed(r1)) {
    //     const r2 = p2(input)
    //     if(failed(r2)) {
    //         return {ast: null, rem: input.slice(0)}
    //     }
    // }
    // return r1
}
function parser_or(ps: Array<(s: string) => ParserResult>, input: string): ParserResult {
    const r = ps[0](input)
    if(failed(r)) {
        return parser_or(ps.slice(1), input)
    }
    return r
}

/**
 * Parses <p1> <op> <p2>
 */
function parser_binary(op: string, p1: Parser, p2: Parser, sinput: string): Parser {
    function pp(sinput: string) {
        const s = removeLeadingWhitespace(sinput)
        let r1 = p1(s)
        if(failed(r1)) {
            return make_result(null, sinput.slice(0))
        }
        let fnode = r1.ast as Tree.TreeNode
        const mult = movePastChar(op, r1.rem)
        if(mult == r1.rem) {
            return make_result(null, sinput.slice(0))
        }
        const rest: string = mult as string
        let r2 = p2(mult)
        if(failed(r2)) {
            return make_result(null, sinput.slice(0))
        }
        let tnode = r2.ast as Tree.TreeNode
        return make_result(Tree.MultNode.make(fnode, tnode), r2.rem)
        }
    return pp
}


export function test_parser() {
    test_add()
    test_whitespace()
    test_anumber() 
}


function test_whitespace() {
    let ss = " 1234"
    const ss2 = removeLeadingWhitespace(ss)
    const r1 = removeLeadingWhitespace("")
    const r2 = removeLeadingWhitespace("  ff")
    const r3 = removeLeadingWhitespace("hh")
}
function test_anumber() {
    const r1 = anumber("")
    const r2 = anumber("aaa")
    const r3 = anumber("1")
    const r4 = anumber("123")
    const r5 = anumber("123 ")
    const r6 = anumber("123X ")
    const r7 = anumber("  123X ")
}
function test_add() {
    function test_one(expression_str: string)
    {
        const r1 = expression(expression_str)
        const s1 = treeAsString(r1.ast as Tree.TreeNode)
        const v1 = treeAsNumber(r1.ast as Tree.TreeNode)
        console.log(`input ${expression_str} result ${s1} value: ${v1}`)
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
// parser_main()