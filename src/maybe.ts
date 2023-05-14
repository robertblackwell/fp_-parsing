/**
 * Simple maybe monad
 */
/**
 * Wraps a T value or is null - so we have Nullable<T>. 
 * We could then do the standard TS thiing and check for null before using a Maybe value.
 * However I wanted the Maybe Monad to be more overtly visible than that approach would have yielded.
 */

class Maybe2<T> {
    value: T | null
    constructor() {
        this.value = null
    }
    static nothing<T>(): Maybe2<T> {
        return new Maybe2()
    }
    static just<T>(t: T) {
        let obj = new Maybe2()
        obj.value = t
        return obj
    }
    static isNothing<T>(mb: Maybe2<T>): boolean {
        return (mb.value == null)
    }
    static getValue<T>(mb: Maybe2<T>): T {
        if(!mb.value) {
            throw new Error(`Maybe.getValue error is nothing `)
        } else {
            return mb.value
        }
    }
    static pure<T>(v: T): Maybe2<T> {
        let obj = Maybe2.just(v) as Maybe2<T>
        return obj
    } 
    /*
    * The definition of a monad
    */
    static eta<T>(v: T): Maybe2<T> {
        return Maybe2.pure(v)
    }
    static mu<T>(mmt: Maybe2<Maybe2<T>>): Maybe2<T> {
        if(Maybe2.isNothing(mmt) || Maybe2.isNothing(Maybe2.getValue(mmt))) {
            return Maybe2.nothing()
        }
        return Maybe2.getValue(Maybe2.getValue(mmt)) as Maybe2<T>
    }
}



export type Maybe<T> = T | null

export function just<T>(t:T): Maybe<T> {
    return t
}
export function nothing(){return null}

export function isNothing<T>(r: Maybe<T>){return (r == null)}

export function get_value<T>(r: Maybe<T>): T {
    if(isNothing(r)) {
        throw new Error(`Maybe.get_value of nothing`)
    }
    return r as T
}
/**
 * Required to make `Maybe` a functor
 */
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
/**
 * `eta` and `mu` are minimum requirement to make `Maybe` a monad.
 */
export function eta<T>(t: T): Maybe<T> {
    return just(t)
} 
export function mu<T>(m: Maybe<Maybe<T>>): Maybe<T> {
    if(m == null) {
        return null
    } else {
        return m as T
    }
}
/**
 * The remaining functions are all derived without reference to any particular
 * properties of `Maybe` other than `fmap` `eta` and `mu`. Hence this
 * derivation would work for any monad `M` -- BUT Typescript has no straightforward way
 * of parameterizing the generic `Monad`.
 * 
 * I need to investigate passing a parameter to a module using arguments in the import `url`
 */
export function kliesli<T,S>(f: (a:T) => Maybe<S>) : (mt:Maybe<T>) => Maybe<S> {
    function tmp(mt: Maybe<T>): Maybe<S> {
        const fmap_f_mt = fmap(f)(mt)
        return mu(fmap_f_mt)
    }
    return tmp
}
/**
 * This is the Haskell `>>=` operation
 */
export function bind<T,S>(x: Maybe<T>, f: (t:T) => Maybe<S>): Maybe<S> {
    return kliesli(f)(x)
}
/**
 * This is the Haskell `<*>` operation and is part of the proof that every Monad
 * is an applicative
 */
export function app<A, B>(pf: Maybe<(a:A) => B>, pa: Maybe<A>): Maybe<B> {
    const h = (pa: Maybe<A>) => {
        const g = (f: (a:A) => B) => {
            const return_fab = (x:A) => eta(f(x))
            return bind(pa, return_fab)
        }
        return g
    }
    const bindvalue = bind(pf, h(pa)) // pf >>= h(pa) is pf <*> pa 
    return kliesli(h(pa))(pf)
}
/**
 * This is one of the key applicative functions and the details prove that
 * the existence of an `<*>` operation implies the existence of the `liftA2` function. 
 */
export function liftA2<A, B, C>(f: (a: A, b: B) => C): (x: Maybe<A>, y: Maybe<B>) => Maybe<C> {
    const curriedf = (a:A) =>{return (b:B) => f(a,b)}    
    const fmap_curriedf = fmap((curriedf))
    const lifted_f = (pa: Maybe<A>, pb: Maybe<B>) => {
        return app(fmap_curriedf(pa), pb)
    }
    return lifted_f
}
/**
 * And this is the proof the the existence of `liftA2` implies the existence of `<*>`
 */

export function app_another<A, B>(pf: Maybe<(a:A) => B>, pa: Maybe<A>): Maybe<B> {
    /**
     * liftA2 implemented using only <*> the alternative applicable definition
     * 
     * @TODO NOTE: something wrong must test
     */
    const uncurried_id = (f: (x:A) => B, a:A) => f(a)
    const lifted_id = liftA2(uncurried_id)
    return lifted_id(pf, pa)
}
/**
 * tests and demonstrations
 */

function test_maybe() {
    function demonstrate_use_of_bind() {
        function without_bind() {
            
        }
    }
}