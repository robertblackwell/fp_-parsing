import * as PR from "./parser_result"

export type ParserType<T> = (s:string) => PR.PResult<T>
export type P<T> = ParserType<T>