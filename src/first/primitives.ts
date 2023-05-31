import * as Tree from "../tree"

import * as AST from "../ast_functions"
import {Ast, ParserAst, ParserResultAst} from "../ast_functions"

import * as Maybe from "../maybe"
import * as PT from "../parser_pair"
import * as PR from "../parser_result"
import {ParserType} from "../parser_type"

type StringParser = ParserType<string>
type StringParserResult = PR.PResult<string>
// type StringParser = 
// function makePredicateParser(pred: (ch: string) => boolean): StringParser {
//     return function(sinput: string):  
// }
/**
 * This is the same as the makeCharAstParser but the result is PR.PResult<string> 
 * and hence can be applied to any string regardless of the nature of the Ast
 */
export function makeCharStringParser(ch: string): StringParser {
    if(ch.length != 1) {
        throw new Error(`makeCharParser ch is too long ${ch}`)
    }
    return function(s: string): StringParserResult {
        let s2 = removeLeadingWhitespace(s)
        if(s2.substring(0, 1) == ch) {
            const remstr = removeLeadingWhitespace(s2.slice(1))
            return PR.make(ch, remstr)
        }
        return PR.make_failed()        
    }
}


/**
 * Make a parser that looks for a ch and produces an Ast 
 * NOTE: The repertoire of such parsers is restricted by 
 * the definition of Ast/Tree.TreeNode and what chars/strings can be used 
 * to make Ast instances.
 * numbers 
*/
export function makeCharAstParser(ch: string): ParserAst {
    if(ch.length != 1) {
        throw new Error(`makeCharParser ch is too long ${ch}`)
    }
    return function(s: string): ParserResultAst {
        let s2 = removeLeadingWhitespace(s)
        if(s2.substring(0, 1) == ch) {
            const ast = Tree.CharNode.make(ch) as Tree.TreeNode as Ast
            const remstr = removeLeadingWhitespace(s2.slice(1))
            return AST.make_result(ast, remstr)
        }
        return AST.make_failed()        
    }
}
// export function parsePlusSignToAst(s: string): ParserResultAst {
//     const f = makeCharAstParser("+")
//     return f(s)
// }
export function parseAdditionSignToAst(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharAstParser("+")
    return f(s)
}
// export function parseMultSignToAst(s: string): ParserResultAst {
//     const f = makeCharAstParser("*")
//     return f(s)
// }
export function parseMultiplySignToAst(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharAstParser("*")
    return f(s)
}
export function parseOpenBracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharAstParser("(")
    return f(s)
}
export function parseCloseBracket(sinput: string): ParserResultAst {
    const s = removeLeadingWhitespace(sinput)
    const f = makeCharAstParser(")")
    return f(s)
}
export function removeLeadingWhitespace(s: string): string {
    if((s.length > 0) && (s.substring(0, 1) == " ")) {
        return removeLeadingWhitespace(s.slice(1))
    }
    return s.slice(0)
}
// export function parseNumberToAst(sinput: string): ParserResultAst {
//     const f = (n: number) => (PM.eta(Tree.NumberNode.make(n) as Ast))
//     const r = PM.bind(parseNumber, f)
//     return r(sinput)
// }
