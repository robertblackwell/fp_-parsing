import * as Tree from "./tree"
import {treeAsNumber, treeAsString} from "./walker"

type Ast = Tree.TreeNode | null
/**
 * 
 * If you look at a Haskell definition of a parser it is a type constructor such as 
 *  
 *       P a :: string -> List (a, string)
 * 
 * If a parser fails to parse the string argument it returns the empty list
 * 
 * I am going to emulate that defintion in typescript. See below.
 * Most of the time a parser, when successful, will return a singleton array. However
 * it turns out we need the List (a, string) definition to handle sequential composition
 * of parsers.
 * 
 * Now for the typescript emulation
 * ================================
 * This cold be done with classes but Iam trying to be brief , so 
 * -    PTuple is a ParserTuple -- soon to become PT<T>
 * -    PResult is a ParserResult -- soon to become PR<T>
 * -    P is the parser type
 * 
 * I have provided a bunch of utility functions so I can change my mind about the data structures latter
 * 
 */
import * as Maybe from "./maybe"
import * as PT from "./parser_tuple"
import * as PR from "./parser_result"

function ast_value(r: ParserResultAst): Ast {
    return PR.first(r)
} 
function ast_remain(r: ParserResultAst): string {
    return PR.second(r)
} 

type P<T> = (s:string) => PR.PResult<T>
type ParserTupleAst = PT.PTuple<Ast>
type ParserResultAst = PR.PResult<Ast>
type ParserResultString = {ast: string | null, rem: string}

function make_result(ast: Ast, rem: string): PR.PResult<Ast> {
    return PR.make(ast, rem)
}
function make_failed(): PR.PResult<Ast> {
    return PR.make_failed<Ast>()
}
type ParserAst = (s: string) => PR.PResult<Ast>

function isDone(r: ParserResultAst): boolean {
    return (ast_remain(r).length == 0)
}
function failed(r: PR.PResult<Ast>): boolean {
    return PR.failed(r)
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
    if(failed(t)) {
        return make_failed()
    }
    const plusresult = parseAdditionSign(ast_remain(t))
    if(failed(plusresult)) {
        return make_failed()
    }
    const rest: string = ast_remain(plusresult) as string
    let exp = expression(rest)
    if(failed(exp)) {
        return make_failed()
    }
    const tnode = ast_value(t) as Tree.TreeNode
    const expnode = ast_value(exp) as Tree.TreeNode
    let newast = Tree.AddNode.make(tnode, expnode)
    return make_result(newast, ast_remain(exp))
}
function term_and_expression_2(sinput: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = ast_value(results[0]) as Tree.TreeNode
        const expnode = ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.AddNode.make(tnode, expnode)
        return PT.make(newast, ast_remain(results[2]))
    } 
    return sequence([term, parseAdditionSign, expression], sinput, f)
}
function term_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(failed(t)) {
        return t
    }
    const tnode = ast_value(t) as Tree.TreeNode
    return make_result(tnode, ast_remain(t))
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
        return make_failed()
    }
    const multresult = parseMultiplySign(ast_remain(fac))
    if(failed(multresult)) {
        return make_failed()
    }
    let t = term(ast_remain(multresult))
    if(failed(t)) {
        return make_result(null, sinput)
    }
    let fnode = ast_value(fac) as Tree.TreeNode
    let tnode = ast_value(t) as Tree.TreeNode
    return make_result(Tree.MultNode.make(fnode, tnode), ast_remain(t))
}
function factor_and_term_2(s: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = ast_value(results[0]) as Tree.TreeNode
        const expnode = ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.MultNode.make(tnode, expnode)
        return PT.make(newast, ast_remain(results[2]))
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
        return make_failed()
    }
    const expresult = expression(ast_remain(openb))
    if(failed(expresult)) {
        return make_result(null, sinput)
    }
    const closeb = parseCloseBracket(ast_remain(expresult))
    if(failed(closeb)) {
        return make_failed()
    }
    const rem = ast_remain(closeb)
    const newexpnode = ast_value(expresult) as Tree.TreeNode
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
        return make_failed()
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
function parseAdditionSign(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharParser("+")
    return f(s)
}
function parseMultSign(s: string): ParserResultAst {
    const f = makeCharParser("*")
    return f(s)
}
function parseMultiplySign(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharParser("*")
    return f(s)
}
function parseOpenBracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharParser("(")
    return f(s)
}
function parseCloseBracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharParser(")")
    return f(s)
}
function makeCharParser(ch: string): ParserAst {
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
        return make_failed()        
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
function parser_or(ps: Array<ParserAst>, input: string): ParserResultAst {
    if(ps.length == 0) {
        return make_failed()
    }
    const r = ps[0](input)
    if(failed(r)) {
        return parser_or(ps.slice(1), input)
    }
    return r
}

/** Try each parser in order on the remainder string of the preceeding parser.
 *  If any step fails stop and return failed without advancing the original string.
 *  If all succeed then we have built an array of ParserTupleAst rather than ParserResultAst 
 *  If all succeed apply the function (3rd arg) to the array of ParserResultAst
*/
function sequence(ps: Array<ParserAst>, sinput: string, combine:(rs:Array<ParserTupleAst>)=>ParserTupleAst): ParserResultAst {
    let s = removeLeadingWhitespace(sinput)
    let index = 0
    let results = []
    while(index < ps.length) {
        const parser = ps[index]
        const r = parser(s)
        if(failed(r)) {
            return make_failed()
        }
        results.push(r as ParserTupleAst)
        s = removeLeadingWhitespace(ast_remain(r))
        index += 1
    }
    if(results.length != ps.length) {
        throw new Error(`sequence successful result has wrong number of components`)
    }
    return Maybe.just(combine(results))
}

/** NOTE: missing some() many() */

/******************************************************************************/
// Tests 
/*******************************************************************************/

export function test_parser() {
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
function test_add() {
    function test_one(expression_str: string)
    {
        console.log(`testing string ${expression_str}`)
        const r1 = expression(expression_str)
        const s1 = treeAsString(ast_value(r1) as Tree.TreeNode)
        const v1 = treeAsNumber(ast_value(r1) as Tree.TreeNode)
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
test_parser()