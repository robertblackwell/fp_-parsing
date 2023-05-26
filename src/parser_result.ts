import * as Maybe from "./maybe"
import * as PP from "./parser_pair"

export type PResult<T> = Maybe.Maybe<PP.PPair<T>>

/** 
* PResult<T> turns out to be a functor. The definition
* of fmap for that functor is given below.
*/
export function fmap<T, S>(f: (t:T) => S): (r: PResult<T>) => PResult<S> {
    function ftuple(pt: PP.PPair<T>): PP.PPair<S> {
        const first = PP.first(pt)
        const second =PP.second(pt)
        const f_first = f(first)
        return PP.make<S>(f_first, second)
    }
    function fmap_f(pr: PResult<T>): PResult<S> {
        if(pr == null) {
            return null
        } else {
            const pt = pr as PP.PPair<T>
            return ftuple(pt) as PP.PPair<S>
        }
    }
    return fmap_f
}


export function failed<T>(r: PResult<T>) {return Maybe.isNothing(r)}
export function make<T>(v: T, rem: string): PResult<T> {return PP.make(v, rem)}
export function make_empty<T>(): PResult<T> {return Maybe.nothing()}
export function make_failed<T>(): PResult<T> {return Maybe.nothing()} 

export function first<T>(pr: PResult<T>): T {
    if(pr == null) {
        throw new Error(`pr_first`)
    }
    return PP.first(pr as PP.PPair<T>)
}
export function second<T>(pr: PResult<T>): string {
    if(pr == null) {
        throw new Error(`pr_first`)
    }
    return PP.second(pr as PP.PPair<T>)
}
