//@file_start maybe_v2.md
//@markdown_start
/*
Haskel definition of a Monad
class Monad m where
  (>>=)  :: m a -> (  a -> m b) -> m b
  (>>)   :: m a ->  m b         -> m b
  return ::   a                 -> m a

View a Monad as an Applicative
fmap fab ma  =  do { a <- ma ; return (fab a) }
            --  ma >>= (return . fab)
pure a       =  do { return a }
            --  return a
mfab <*> ma  =  do { fab <- mfab ; a <- ma ; return (fab a) }
            --  mfab >>= (\ fab -> ma >>= (return . fab)) 
            --  mfab `ap` ma
*/
//@markdown_end
//@code_start
export type ParserResult<T> = [T, string] | null

export function makeJustParserResult<T>(r: T, rem: string): ParserResult<T> {
    return [r, rem]
}
export function makeNothingParserResult<T>() {
    return null
}
export type Parser<T> = (sinput: string) => ParserResult<T>

//@code_end
/**
 * Claim that the "type constructor" PT.ParserType<T> is an applicative functor.
 * 
 * Below we will demonstrate
 */

/**
 * ## Parsers as a functor
 */
export type P<T> = Parser<T>

export function fmap<A,B>(f:(a:A)=>B): (p: P<A>) => P<B> {
    return function(p:P<A>): P<B> {
        return function(s:string): ParserResult<B> {
            const r1 = p(s)
            if(r1 === null) {
                return makeNothingParserResult()
            } else{
                const [res1, rem1]: [A, string] = r1
                const b = f(res1)
                return makeJustParserResult(b, rem1)
            }
        }
    }
}
/**
 * ## Parsers as a Monad
 * 
 * Step 1 define `eta` and `mu`
 */
export function eta<T>(t:T): P<T> {
    return (s: string) => makeJustParserResult(t, s)
}

export function pure<A>(a: A): P<A> {
    return eta(a)
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
    const rr = function(s: string):ParserResult<A> {
        const fs: ParserResult<Parser<A>> = f(s)
        if(fs === null)
            return makeNothingParserResult()
        else {
            const [fv, fstr]:[Parser<A>, string] = fs
            const rr: ParserResult<A> = fv(fstr)
            return rr
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
 * I need to make an abbreviation F<A,B> as if I put this type 'inline' in the arguments for `ap`
 * I get squiggly lines - guess the language server for TS cannot handle it.
 * 
 * Note that `function apply()` is `liftM2` applied to the function
 * 
 * [A=>B, A] => B defined as ([f,a]) => f(a)
 * 
 * In the following I have given an explicit formular for that calculation
 */

type F<A,B> = (a:A) => B
export function apply<A,B>(f: P<F<A,B>>, x:P<A>): P<B> {
    const res = bind(f, (h) => bind(x, (a) => eta(h(a))))
    return res
}
/**
 * 
 * NOTE : the choice function is more explicit and cannot use the Maybe.chocie function
 * 
 * This function implements the "|" operator in a BNF notation.
 * 
 * It also makes the P monad into an `Alternative`
 */
export function choice<A>(p1: P<A>, p2: P<A>): P<A> {
    return (s: string) => {
        const r1 = p1(s)
        return (r1) ? r1: p2(s)
    }
}

//@file_start junk.md
//@ignore_start
import * as Tree from "../tree"
type TNode = Tree.TreeNode

export function sameParserResult(label: string, actual: ParserResult<TNode>, expected: ParserResult<TNode>) {
    if( ((actual !== null) && (expected === null))) {
        console.log([`${label}: failed disagree re isNothing()`, 'expected is nothing', 'actual is not'])
        return false
    }
    if( ((actual === null) && (expected !== null))) {
        console.log([`${label}: failed disagree re isNothing()`,'expected is NOT nothing','actual is nothing'])
        return false
    }
    if((actual !== null) && (expected !== null)) {
    const [r1, rem1] = actual
    const [r2, rem2] = expected
    const s1 = Tree.treeAsString(r1)
    const s2 = Tree.treeAsString(r2)
    console.log(`actual exp: ${s1} expected exp: ${s2}`)
    return (s1.replace(/\s/g,"") === s2.replace(/\s/g,""))
    }
    return true
}
//@ignore_end
//@file_end