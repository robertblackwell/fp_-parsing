import * as Tree from "./tree"
import {treeAsNumber, treeAsString} from "./walker"
type Ast = Tree.TreeNode | null

type PR<T> = {result: T | null, rem: string}
function pr_make_result<T>(result: T | null, rem: string): PR<T> {
    return {result, rem}
}
function pr_make_failed(s: string): PR<T> {
    return pr_make_result(null, s)
}


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

// exp ::= term + exp | term - must try the one that consumes the most text first
function expression(sinput: string): ParserResultAst {
    function term_and_expression(s: string): ParserResultAst {
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
    function term_only(sinput: string): ParserResultAst {
        const s = removeLeadingWhitespace(sinput)
        const t = term(s)
        if(failed(t) || isDone(t)) {
            return t
        }
        const tnode = t.ast as Tree.TreeNode
        return make_result(tnode, t.rem)
    }
    return parser_or([term_and_expression, term_only], sinput)
}

// term ::= factor * term | factor
function term(sinput: string): ParserResultAst {
    function factor_and_term(sinput: string): ParserResultAst {
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
    function factor_only(sinput: string): ParserResultAst {
        const s = removeLeadingWhitespace(sinput)
        let fac = factor(s)
        if(failed(fac) || isDone(fac)) {
            return make_result(null, sinput)
        }
        return fac
    }
    return parser_or([factor_and_term, factor_only], sinput)
}

function factor(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    return parser_or([anumber, bracket], s)
}

// 
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
/*****************************
 * Ways of combining parser
 ******************************/

// Alternative - try each parser in order, on the original input, and return the result of the first that succeeds
function parser_or(ps: Array<(s: string) => ParserResultAst>, input: string): ParserResultAst {
    if(ps.length == 0) {
        return make_result(null, input)
    }
    const r = ps[0](input)
    if(failed(r)) {
        return parser_or(ps.slice(1), input)
    }
    return r
}

// Try each parser in order on the remainder string of the preceeding parser.
// If any step fails stop and return failed without advancing the original string.
// If all succeed apply the function (3rd arg) to the array of ParserResultAst
function sequence(ps: Array<Parser>, sinput: string, combine:(rs:Array<ParserResultAst>)=>ParserResultAst): ParserResultAst {
    function dosequence(ps: Array<Parser>, sinput: string): Array<ParserResultAst> {
        const s = removeLeadingWhitespace(sinput)
        const r = ps[0](s)
        if(failed(r))
            return []
        return [r].concat(dosequence(ps.slice(1), r.rem))
    }
    const r = dosequence(ps, sinput)
    if(r.length == 0) {
        return make_failed(sinput)
    }
    return combine(r)
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