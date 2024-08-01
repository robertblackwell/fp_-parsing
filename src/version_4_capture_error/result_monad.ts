//@file_start maybe_v2.md
//@markdown_start
/*
# Maybe Monad - Version 2

This version has been expanded to contain all the __Monad__ functions and an additional
one called `choice`.

One of the things to notice about much of the work below is that once `eta` and `mu`
are defined many of the other functions do not depend on the specific nature of the
`Maybe` functor but are general derivations from the existence and attributes of `eta` and `mu`.

This is also true of the derivation of the `apply` function which demonstrates that a `Monad`
is also an applicative functor.

Finally the definition of the `chocie` function which is specific to the `Maybe` Monad
demonstrates that `Maybe` is an `Alternative` functor.

## Maybe - type definition

Wraps a T value or is null - so we have Nullable<T>. 
We could then do the standard TS thing and check for null before using a Maybe value.
However I wanted the Maybe Monad to be more overtly visible than that approach would have yielded.
*/
//@markdown_end
//@code_start

// export type Failed = {
//     // some kind of identifier to indicate where the error was detected
//     code: string, 
//     // the input as it was when the error was detected
//     sinput: string
// }

// function makeFailed(code: string, sinput: string): Failed {
//     return {code: code, sinput: sinput}
// }


// export type Type<T> = T | Failed

export type Type<T> = {
    isFailed : boolean,
    value: T | null,
    code: string,
    rem: string
}

export function makeResult<T>(t: T): Type<T> {
    return {isFailed: false, value:t, code:"", rem:""} //t as Type<T>
}
export function makeFailedResult<T>(code: string, sinput: string): Type<T> {
    return  {isFailed: true, value:null, code: code.slice(0), rem: sinput.slice(0)}//makeFailed(code, sinput)
}
export function isFailedResult<T>(r: Type<T>): boolean {
        return (r.isFailed) 
}

export function getValue<T>(r: Type<T>): T {
    if(isFailedResult(r)) {
        throw Error("trying to be value from a nothing Maybe")
    } else {
        if(r.value === null) {
            throw Error("trying to be value from a nothing Maybe")
        }
        return r.value
    }
}
export function fmap<A,B>(f:(a:A) => B): (x: Type<A>) => Type<B> {
    return function(x: Type<A>): Type<B> {
        if(isFailedResult(x)) {
            return makeFailedResult(x.code, x.rem)
        }
        const a = getValue(x)
        const fa = f(a)
        return makeResult(fa)
    }
}
export function pure<T>(v: T): Type<T> {
    return makeResult(v)
} 
/*
* The definition of a monad
*/
export function eta<T>(v: T): Type<T> {
    return pure(v)
}
export function mu<T>(mmt: Type<Type<T>>): Type<T> {
    if(isFailedResult(mmt)) {
        const r = makeFailedResult<T>(mmt.code, mmt.rem)
        return r
    }
    const r2 = getValue(mmt)
    if(isFailedResult(r2)){
        const r = makeFailedResult<T>(r2.code, r2.rem)
        return r
    }
    return makeResult(getValue(r2))
}
//@code_end
//@markdown_start
/*
## Functions that are derived from `eta` and `mu`

The remaining functions are all derived without reference to any particular
properties of `Maybe` other than `fmap` `eta` and `mu`. Hence this
derivation would work for any monad `M` -- BUT Typescript has no straightforward way
of parameterizing the generic `Monad`.
 
I need to investigate passing a parameter to a module using arguments in the import `url`
*/
//@markdown_end
//@code_start

export function kliesli<T,S>(f: (a:T) => Type<S>) : (mt: Type<T>) => Type<S> {
    function tmp(mt: Type<T>): Type<S> {
        const fmap_f_mt = fmap(f)(mt)
        return mu(fmap_f_mt)
    }
    return tmp
}
/**
 * This is the Haskell `>>=` operation
 */
export function bind<T,S>(x: Type<T>, f: (t:T) => Type<S>): Type<S> {
    return kliesli(f)(x)
}
/**
 * This is the Haskell `<*>` operation and is part of the proof that every Monad
 * is an Applicative
 */
export function apply<A, B>(pf: Type<(a:A) => B>, pa: Type<A>): Type<B> {
    const h = (pa: Type<A>) => {
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
export function kliesliA2<A, B, C>(f: (a: A, b: B) => C): (x: Type<A>, y: Type<B>) => Type<C> {
    const curriedf = (a:A) =>{return (b:B) => f(a,b)}    
    const fmap_curriedf = fmap((curriedf))
    const lifted_f = (pa: Type<A>, pb: Type<B>) => {
        return apply(fmap_curriedf(pa), pb)
    }
    return lifted_f
}
/**
 * Returns the first result that is not nothing
 * 
 * This operation makes Maybe into a `Alternative`
 * 
 * choice() can be extended to an n-ary function 
 * 
 * eg choice3(ma1, ma2, ma3) = choice(choice(ma1, ma2), ma3)
 */
export function choice<A>(ma1: Type<A>, ma2: Type<A>): Type<A> {
    if(isFailedResult(ma1)) {
        if(isFailedResult(ma2)) {
            return makeFailedResult(ma2.code, ma2.rem)
        }
        return makeFailedResult(ma1.code, ma1.rem)
    }
    return makeResult(getValue(ma1))
}
//@code_end
//@markdown_start
/*

//And this is the proof the the existence of `liftA2` implies the existence of `<*>`

export function app_another<A, B>(pf: Type<(a:A) => B>, pa: Type<A>): Type<B> {
    
    //  liftA2 implemented using only <*> the alternative applicable definition
    //  
    //  @TODO NOTE: something wrong must test
    
    const uncurried_id = (f: (x:A) => B, a:A) => f(a)
    const lifted_id = liftA2(uncurried_id)
    return lifted_id(pf, pa)
}
*/
//@markdown_end
//@ignore_start
/**
 * tests and demonstrations
 */

function test_maybe() {
    function demonstrate_use_of_bind() {
        function without_bind() {
            
        }
    }
}
//@ignore_end
//@file_end