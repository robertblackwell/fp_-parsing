import * as Maybe from "./maybe"
import * as PT from "./parser_tuple"

export type PResult<T> = Maybe.Maybe<PT.PTuple<T>>
/** 
* PResult<T> turns out to be a functor. The definition
* of fmap for that functor is given below.
*/
export function fmap<T, S>(f: (t:T) => S): (r: PResult<T>) => PResult<S> {
    function ftuple(pt: PT.PTuple<T>): PT.PTuple<S> {
        const first = PT.first(pt)
        const second =PT.second(pt)
        const f_first = f(first)
        return PT.make<S>(f_first, second)
    }
    function fmap_f(pr: PResult<T>): PResult<S> {
        if(pr == null) {
            return null
        } else {
            const pt = pr as PT.PTuple<T>
            return ftuple(pt) as PT.PTuple<S>
        }
    }
    return fmap_f
}


export function failed<T>(r: PResult<T>) {return Maybe.isNothing(r)}
export function make<T>(v: T, rem: string): PResult<T> {return PT.make(v, rem)}
export function make_empty<T>(): PResult<T> {return Maybe.nothing()}
export function make_failed<T>(): PResult<T> {return Maybe.nothing()} 

export function first<T>(pr: PResult<T>): T {
    if(pr == null) {
        throw new Error(`pr_first`)
    }
    return PT.first(pr as PT.PTuple<T>)
}
export function second<T>(pr: PResult<T>): string {
    if(pr == null) {
        throw new Error(`pr_first`)
    }
    return PT.second(pr as PT.PTuple<T>)
}
