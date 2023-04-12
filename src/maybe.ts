/**
 * Simple maybe monad
 */
/**
 * Wraps a T value or is null - so we have Nullable<T>. 
 * We could then do the standard TS thiing and check for null before using a Maybe value.
 * However I wanted the Maybe Monad to be more overtly visible than that approach would have yielded.
 */
export type Maybe<T> = T | null

export function just<T>(t:T): Maybe<T> {
    return t
}
export function eta<T>(t: T): Maybe<T> {
    return just(t)
} 
export function nothing(){return null}

export function isNothing<T>(r: Maybe<T>){return (r == null)}

export function get_value<T>(r: Maybe<T>): T {
    if(isNothing(r)) {
        throw new Error(`Maybe.get_value of nothing`)
    }
    return r as T
}

export function fmap<T,S>(f:(t:T) => S): (x:Maybe<T>) => Maybe<S> {
    function tmp(x:Maybe<T>): Maybe<S> {
        if(x == null) {
            return null
        } else {
            const just_x = x as T
            return just(f(just_x))
        }
    }
    return tmp
}
export function mu<T>(m: Maybe<Maybe<T>>): Maybe<T> {
    if(m == null) {
        return null
    } else {
        return m as T
    }
}

export function kliesli<T,S>(f: (a:T) => Maybe<S>) : (mt:Maybe<T>) => Maybe<S> {
    function tmp(mt: Maybe<T>): Maybe<S> {
        const fmap_f_mt = fmap(f)(mt)
        return mu(fmap_f_mt)
    }
    return tmp
}

export function bind<T,S>(x: Maybe<T>, f: (t:T) => Maybe<S>): Maybe<S> {
    return kliesli(f)(x)
}