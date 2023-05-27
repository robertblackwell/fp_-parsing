import * as Tree from "./tree"
import {treeAsNumber, treeAsString} from "./walker"
import {
    Ast, 
    ParserTupleAst, ParserResultAst, 
    failed, isDone,
    make_result, make_failed, 
    ast_remain, ast_value} from "./ast_functions"
import {assert} from "../tests/test_helpers"
import * as AST from "./ast_functions"
import * as PT from "./parser_pair"
import * as PR from "./parser_result"
import * as PM from "./parser_monad" 
import * as PA from "./parser_applicative"
import {ParserType} from "./parser_type"
import * as PC from "./parser_combiners"
import {
    removeLeadingWhitespace,
    parseMultSign, parseMultiplySign,
    parseAdditionSign, parsePlusSignToAst,
    parseOpenBracket, parseCloseBracket
} from "./primitives"
import { parseMultSignToString, parsePlusSignToString, createPredicateParser, createPredicateParserStripLeadingWhiteSpace } from "./string_primitives"

type P<T> = ParserType<T>
/**
 * This file contains the parsers/functions that parser an aritmetic expression.
 * And only those functions as all support functions are imported.
 * 
 * The bnf definition of the parsing operation is 
 * 
 *      exp  ::= term + exp | term
 *      term ::= factor * term | factor
 *      factor :: = number | (exp)
 *
 * This structure is copied in the following parsers/function.
 */
/**
 * parse an expression
 * - first try 
 *      exp ::= term + exp
 * - if that fails try 
 *      term
*/
// export function expression_3(sinput: string): ParserResultAst {
//     return PM.choice(term_and_expression_3, term_only_3)(sinput)
// }
// export function term_and_expression_3(sinput: string): ParserResultAst {
//     function f(termNode: Ast, plussign: string, expNode: Ast): P<Ast> {
//         let newast = Tree.AddNode.make(termNode, expNode)
//         return PM.eta(newast)
//     } 
//     const newparser = PM.bindM3(term_3, parsePlusSignToString, expression_3, f)
//     return newparser(sinput)
// }
// export function term_only_3(sinput: string): ParserResultAst {
//     return term_3(removeLeadingWhitespace(sinput))
// }
// export function term_3(sinput: string): ParserResultAst {
//     return PM.choice(factor_and_term_3, factor_only_3)(sinput)
// }
// export function factor_and_term_3(sinput: string): ParserResultAst {
//     function f(factorNode: Ast, multsign: string, termNode: Ast): P<Ast> {
//         let newast = Tree.MultNode.make(factorNode, termNode)
//         return PM.eta(newast)
//     } 
//     const newparser = PM.bindM3(factor_only_3, parseMultSignToString, term_3, f)
//     return newparser(sinput)
// }
// export function factor_only_3(sinput: string): ParserResultAst {
//     return PM.choice(parse_number_3, parse_bracket_3)(removeLeadingWhitespace(sinput))
// }
// export function parse_bracket_3(sinput: string): ParserResultAst {
//     function f(ob: string, bnode: Tree.TreeNode, cb: string) {
//         return PM.eta(Tree.BracketNode.make(bnode))
//     }
//     const openbracket = createPredicateParserStripLeadingWhiteSpace((s: string) => (s === "("))
//     const closebracket = createPredicateParserStripLeadingWhiteSpace((s: string) => (s === ")"))
//     return PM.bindM3(openbracket, expression_3, closebracket, f)(sinput)
// }
// export function parse_number_3(sinput: string) : ParserResultAst {
//     const digitParser = createPredicateParser((ss: string) => ((ss.substring(0, 1).match(/[0-9]/g) != null)))
//     const manydigits = PC.many(digitParser)
//     function f(ss: string[]): P<Ast> {
//         const an_ast = (Tree.NumberNode.make(parseInt(ss.join(""))) as Ast)
//         return PM.eta(an_ast)
//     }
//     function g(ss: string[]): Ast {
//         return Tree.NumberNode.make(parseInt(ss.join(""))) as Ast
//     }
//     const applicative_result = PA.ap(PM.eta(g), manydigits)
//     const monadic_result = PM.bind(manydigits, f)(removeLeadingWhitespace(sinput))
//     //the two results are the same, return one of them
//     return monadic_result
// }

/*********************************************************************************** */

export function expression(sinput: string): ParserResultAst {
    const r = PC.parser_or([term_and_expression, term_only], sinput)
    return r
}
export function term_and_expression_old(sinput: string): ParserResultAst {
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
export function term_and_expression(sinput: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = ast_value(results[0]) as Tree.TreeNode
        const expnode = ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.AddNode.make(tnode, expnode)
        return PT.make(newast, ast_remain(results[2]))
    } 
    return PC.sequence([term, parseAdditionSign, expression], sinput, f)
}

/*
*  term_only
*/
export function term_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const t = term(s)
    if(failed(t)) {
        return t
    }
    const tnode = ast_value(t) as Tree.TreeNode
    return make_result(tnode, ast_remain(t))
}

export function term(sinput: string): ParserResultAst {
    const rr = PC.parser_or([factor_and_term_2, factor_only], sinput)
    return rr
}
/*
* factor_and_term variants
*/
export function factor_and_term(sinput: string): ParserResultAst {
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
        return make_failed()
    }
    let fnode = ast_value(fac) as Tree.TreeNode
    let tnode = ast_value(t) as Tree.TreeNode
    return make_result(Tree.MultNode.make(fnode, tnode), ast_remain(t))
}
export function factor_and_term_2(s: string): ParserResultAst {
    function f(results: Array<ParserTupleAst>): ParserTupleAst {
        if(results.length != 3) {
            throw new Error(`term_and_expression result incorrect length ${results.length}`)
        }
        const tnode = ast_value(results[0]) as Tree.TreeNode
        const expnode = ast_value(results[2]) as Tree.TreeNode
        let newast = Tree.MultNode.make(tnode, expnode)
        return PT.make(newast, ast_remain(results[2]))
    } 
    const rr = PC.sequence([factor, parseMultiplySign, term], s, f)
    return rr
}
export function factor_only(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    let fac = factor(s)
    if(failed(fac)) {
        return make_failed()
    }
    return fac
}
export function factor(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    return PC.parser_or([parse_number, parse_bracket], s)
}
/*
* bracket variants
*/
export function parse_bracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const openb = parseOpenBracket(s)
    if(failed(openb)) {
        return make_failed()
    }
    const expresult = expression(ast_remain(openb))
    if(failed(expresult)) {
        return make_failed()
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
/*
* number variants
*/
export function parse_number(s: string) : ParserResultAst {

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