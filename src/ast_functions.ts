import * as Tree from "./tree"

import * as Maybe from "./maybe"
import * as PT from "./parser_pair"
import * as PR from "./parser_result"

export type Ast = Tree.TreeNode

export function ast_value(r: ParserResultAst): Ast {
    return PR.first(r)
} 
export function ast_remain(r: ParserResultAst): string {
    return PR.second(r)
} 

export type ParserTupleAst = PT.PPair<Ast>
export type ParserResultAst = PR.PResult<Ast>
export type ParserResultString = {ast: string | null, rem: string}

export function make_result(ast: Ast, rem: string): PR.PResult<Ast> {
    return PR.make(ast, rem)
}
export function make_failed(): PR.PResult<Ast> {
    return PR.make_failed<Ast>()
}
export type ParserAst = (s: string) => PR.PResult<Ast>

export function isDone(r: ParserResultAst): boolean {
    return (ast_remain(r).length == 0)
}
export function failed(r: PR.PResult<Ast>): boolean {
    return PR.failed(r)
}
