import * as PP from "./parser_pair"
import * as PR from "./parser_result"
import * as PT from "./parser_type"
import * as Maybe from "./maybe"

// Haskel definition of a Monad
// class Monad m where
//   (>>=)  :: m a -> (  a -> m b) -> m b
//   (>>)   :: m a ->  m b         -> m b
//   return ::   a                 -> m a

// View a Monad as an Applicative
// fmap fab ma  =  do { a <- ma ; return (fab a) }
//             --  ma >>= (return . fab)
// pure a       =  do { return a }
//             --  return a
// mfab <*> ma  =  do { fab <- mfab ; a <- ma ; return (fab a) }
//             --  mfab >>= (\ fab -> ma >>= (return . fab)) 
//             --  mfab `ap` ma


function compose<X, Y>(f: (s:string) => X, g: (x:X) => Y): (s:string) => Y {
    return (s: string) => g(f(s))
}

/**
 * Claim that the "type constructor" PT.ParserType<T> is an applicative functor.
 * 
 * Below we will demonstrate
 */

/**
 * ## Parsers as a functor
 */
export type P<T> = PT.ParserType<T>

export function fmap<A,B>(f:(a:A)=>B): (p: P<A>) => P<B> {
    const f2 = Maybe.fmap(PP.fmap(f))
    return function k(p: P<A>) {return compose(p, f2)}
}

/**
 * ## Parsers as a Monad
 * 
 * Step 1 define `eta` and `mu`
 */
export function pure<T>(t:T): P<T> {
    return (s: string) => Maybe.just(PP.make(t, s))
}

export function eta<A>(a: A): P<A> {
    return pure(a)
}

/**
 * Our parse type constructor is a Monad
 * 
 * `eta`: A -> P<A> is the same as `pure`
 * 
 * The trick is to make `mu`: P<P<A>> -> P<A>
 * 
 * Lets have a go at defining `mu` for the Parser Monad
 */

export function mu<A>(f: P<P<A>>): P<A> {
    const rr = (s: string) => {
        const fs = f(s)
        if(Maybe.isNothing(fs))
            return Maybe.nothing()
        else {
            const ftuple = Maybe.get_value(fs)
            const fv = PP.get_value(ftuple)
            const fstr = PP.get_remaining_input(ftuple)
            const r = fv(fstr)
            return r
        }
    }
    return rr
}

/**
 * ## Some derived monad characteristics
 */

/**
 * The `kliesli` function lifts a function A -> P<B> to a function P<A> -> P<B>.
 * 
 * The existence of this 'lifting' is an alternative way of specifying a monad.
 * 
 * Note: That with a `mu` already provided for the Parser Monad the 
 * definition of the `kliesli` function is completely general and hence the following
 * definition would work for ANY monad.
 * 
 * Also note the `mu: P<P<A>> -> P<A>` can be recovered from the `kliesli` function
 * as
 * ```
 *  `mu` : P<P<A>> -> P<A>` = `kliesli(identity: P<A> -> P<A>)`
 * ```
 */
export function kliesli<A,B>(f:(a: A) => P<B>): (pa: P<A>) => P<B> {
    const r1 = fmap(f)
    const result_function = (x:P<A>): P<B> => {
        const z1 = fmap(f)(x)
        const z2 = mu(z1)
        return z2
    }
    return result_function
}

/**
 * In haskell it is common to define a bind operation (a binary operation called >>=) for monads.
 * 
 * Since TYpescript dos not permit definition of new infix operators the best we can do is define
 * `bind` as a binary function.
 * 
 * THe existence of a `bind` operation is an alternative way of specifying a monad.
 *  
 * Note: That with a `mu` already provided for the Parser Monad the definition of `bind`
 * is completely general and would work for ANY Monad
 * 
 * Also note that `mu: P<P<A>> -> P<A>` can be recovered from a `bind` operation
 * as follows:
 * 
 * First derive the `kliesli` function from the `bind` function as follows:
 * 
 * Consider `f: A -> P<B>` and define `kliesli(f): P<A> -> P<B>` as `\pa -> bind(pa, f)`.
 * 
 * Then `mu = kliesli(identity: P<A> -> P<A>)`
 * 
 */
export function bind<A,B>(pa: P<A>, f:(a:A) => P<B>) {
    return kliesli(f)(pa)
}

export function bindM2<A,B,C>(pa: P<A>, pb: P<B>, f:(a:A, b:B) => P<C>): P<C> {
    const r = bind(pa, (a:A) => bind(pb, (b: B) => f(a,b)))
    return r       
} 
export function bindM3<A,B,C, D>(pa: P<A>, pb: P<B>, pc: P<C>, f:(a:A, b:B, c: C) => P<D>): P<D> {
    const r = bind(pa, (a:A) => bind(pb, (b: B) => bind(pc, (c:C) => f(a,b,c))))
    return r       
} 

export function liftM2<A,B,C>(pa: P<A>, pb: P<B>, f:(a:A, b:B) => C): P<C> {
    const eta_f = (a: A, b: B) => {return eta(f(a, b))}
    return bindM2(pa, pb, eta_f)
}
export function liftM3<A,B,C, D>(pa: P<A>, pb: P<B>, pc: P<C>, f:(a:A, b:B, c: C) => D): P<D> {
    const eta_f = (a: A, b: B, c: C) => {return eta(f(a, b, c))}
    return bindM3(pa, pb, pc, eta_f)
}
/**
 * This function implements the "|" operator in a BNF notation.
 * 
 * It also makes the P monad into an `Alternative`
 */
export function choice<A>(p1: P<A>, p2: P<A>): P<A> {
    return (s: string) => Maybe.choice(p1(s), p2(s))
}

function test() {
    console.log(`hello`)
}
// test()