import * as Tree from "../src/tree/tree"
import {treeAsNumber, treeAsString} from "../src/tree/walker"
type Ast = Tree.TreeNode | null

type ParserResultAst = {ast: Ast, rem: string}
type ParserResultString = {ast: string | null, rem: string}

function make_result(ast: Ast, rem: string) {
    return {ast, rem}
}
function make_failed(s: string) {
    return make_result(null, s)
}
type Parser = (s: string) => ParserResultAst

function isDone(r: ParserResultAst): boolean {
    return (r.rem.length == 0)
}
function failed(r: ParserResultAst): boolean {
    return (r.ast == null)
}
/***************************************************************************** */
// parse an expression
// exp ::= term + exp | term - must try the one that consumes the most text first
/***************************************************************************** */
function expression(sinput: string): ParserResultAst {
    const r = parser_or([term_and_expression_2, term_only], sinput)
    return r
}
function term_and_expression_1(sinput: string): ParserResultAst {
    const s  = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(failed(t) || isDone(t)) {
        return make_failed(sinput)
    }
    const plusresult = parseAdditionSign(t.rem)
    if(failed(plusresult)) {
        return make_failed(sinput)
    }
    const rest: string = plusresult.rem as string
    let exp = expression(rest)
    if(failed(exp)) {
        return make_failed(sinput)
    }
    const tnode = t.ast as Tree.TreeNode
    const expnode = exp.ast as Tree.TreeNode
    let newast = Tree.AddNode.make(tnode, expnode)
    return make_result(newast, exp.rem)
}
function term_and_expression_2(sinput: string): ParserResultAst {
    function f(results: Array<ParserResultAst>): ParserResultAst {
        if(results.length == 0){
            return make_failed(sinput)
        }
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = results[0].ast as Tree.TreeNode
        const expnode = results[2].ast as Tree.TreeNode
        let newast = Tree.AddNode.make(tnode, expnode)
        return make_result(newast, results[2].rem)
    } 
    return sequence([term, parseAdditionSign, expression], sinput, f)
}
function term_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(failed(t) || isDone(t)) {
        return t
    }
    const tnode = t.ast as Tree.TreeNode
    return make_result(tnode, t.rem)
}
/***************************************************************************** */
// parse a term
// term ::= factor * term | factor
/***************************************************************************** */
function term(sinput: string): ParserResultAst {
    const rr = parser_or([factor_and_term_2, factor_only], sinput)
    return rr
}
function factor_and_term_1(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(failed(fac) || isDone(fac)) {
        return make_result(null, sinput)
    }
    const multresult = parseMultiplySign(fac.rem)
    if(failed(multresult)) {
        return make_result(null, sinput)
    }
    let t = term(multresult.rem)
    if(failed(t)) {
        return make_result(null, sinput)
    }
    let fnode = fac.ast as Tree.TreeNode
    let tnode = t.ast as Tree.TreeNode
    return make_result(Tree.MultNode.make(fnode, tnode), t.rem)
}
function factor_and_term_2(s: string): ParserResultAst {
    function f(results: Array<ParserResultAst>): ParserResultAst {
        if(results.length == 0) {
            return make_failed(s)
        }
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = results[0].ast as Tree.TreeNode
        const expnode = results[2].ast as Tree.TreeNode
        let newast = Tree.MultNode.make(tnode, expnode)
        return make_result(newast, results[2].rem)
    } 
    const rr = sequence([factor, parseMultiplySign, term], s, f)
    return rr
}
function factor_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(failed(fac)) {
        return make_result(null, sinput)
    }
    return fac
}
/***************************************************************************** */
// parse a factor
// factor ::= nat | (expression)
/***************************************************************************** */
function factor(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    return parser_or([anumber, bracket], s)
}
function bracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const openb = parseOpenBracket(s)
    if(failed(openb)) {
        return make_result(null, sinput)
    }
    const expresult = expression(openb.rem)
    if(failed(expresult)) {
        return make_result(null, sinput)
    }
    const closeb = parseCloseBracket(expresult.rem)
    if(failed(closeb)) {
        return make_result(null, sinput)
    }
    const rem = closeb.rem
    const newexpnode = expresult.ast as Tree.TreeNode
    const rnode = Tree.BracketNode.make(newexpnode)
    return make_result(rnode, rem)
}
function anumber(s: string) : ParserResultAst {

    function isDigit(char: string) {
        return (char.length == 1) && (/^\d$/.test(char))
    }
    function extractNumber(str: string): {numstr: string, rem: string} {
        if(str.length == 0) {
            return {numstr:"", rem: ""}
        }
        const ch = str.substring(0, 1)
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

/***************************************************************************** */
// parser primitives 
/***************************************************************************** */
function parsePlusSign(s: string): ParserResultAst {
    const f = makeCharParser("+")
    return f(s)
}
function parseAdditionSign(s: string): ParserResultAst {
    const f = makeCharParser("+")
    return f(s)
}
function parseMultSign(s: string): ParserResultAst {
    const f = makeCharParser("*")
    return f(s)
}
function parseMultiplySign(s: string): ParserResultAst {
    const f = makeCharParser("*")
    return f(s)
}
function parseOpenBracket(s: string): ParserResultAst {
    const f = makeCharParser("(")
    return f(s)
}
function parseCloseBracket(s: string): ParserResultAst {
    const f = makeCharParser(")")
    return f(s)
}
function makeCharParser(ch: string): Parser {
    if(ch.length != 1) {
        throw new Error(`makeCharParser ch is too long ${ch}`)
    }
    return function(s: string): ParserResultAst {
        let s2 = removeLeadingWhitespace(s)
        if(s2.substring(0, 1) == ch) {
            const ast = Tree.CharNode.make(ch) as Tree.TreeNode as Ast
            const remstr = removeLeadingWhitespace(s2.slice(1))
            return make_result(ast, remstr)
        }
        return make_result(null, s)        
    }
}
function removeLeadingWhitespace(s: string): string {
    if((s.length > 0) && (s.substring(0, 1) == " ")) {
        return removeLeadingWhitespace(s.slice(1))
    }
    return s.slice(0)
}
/******************************************************************************/
// Ways of combining parser
/*******************************************************************************/

/** 
 * Alternative - try each parser in order, on the original input, and return the result of the first that succeeds
*/
function parser_or(ps: Array<Parser>, input: string): ParserResultAst {
    if(ps.length == 0) {
        return make_result(null, input)
    }
    const r = ps[0](input)
    if(failed(r)) {
        return parser_or(ps.slice(1), input)
    }
    return r
}

/** Try each parser in order on the remainder string of the preceeding parser.
 *  If any step fails stop and return failed without advancing the original string.
 *   If all succeed apply the function (3rd arg) to the array of ParserResultAst
*/
function sequence(ps: Array<Parser>, sinput: string, combine:(rs:Array<ParserResultAst>)=>ParserResultAst): ParserResultAst {
    let s = removeLeadingWhitespace(sinput)
    let index = 0
    let results = []
    while(index < ps.length) {
        const parser = ps[index]
        const r = parser(s)
        if(failed(r)) {
            return make_failed(sinput)
        }
        results.push(r)
        s = removeLeadingWhitespace(r.rem)
        index += 1
    }
    if(results.length != ps.length) {
        throw new Error(`sequence successful result has wrong number of components`)
    }
    return combine(results)
}

/** NOTE: missing some() many() */

/******************************************************************************/
// Tests 
/*******************************************************************************/
    // this is the main module
  
    function test_parser() {
        test_sequence()
        test_add()
        test_whitespace()
        test_anumber() 
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
    function test_anumber() {
        const r1 = anumber("")
        const r2 = anumber("aaa")
        const r3 = anumber("1")
        const r4 = anumber("123")
        const r5 = anumber("123 ")
        const r6 = anumber("123X ")
        const r7 = anumber("  123X ")
    }
    function test_expr() {
        function test_one(expression_str: string)
        {
            console.log(`testing string ${expression_str}`)
            const r1 = expression(expression_str)
            const s1 = treeAsString(r1.ast as Tree.TreeNode)
            const v1 = treeAsNumber(r1.ast as Tree.TreeNode)
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
if (typeof module !== 'undefined' && !module.parent) {
    test_parser()
    test_sequence()
    test_whitespace()
    test_anumber()
    test_expr()
}