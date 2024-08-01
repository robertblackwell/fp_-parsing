//@file_start maybe_v2.md
//@ignore_start
// import * as PP from "./parser_pair"
// import * as PR from "./parser_result"
// import * as PT from "./parser_type"
import * as Result from "../version_4_capture_error/result_monad"
//@ignore_end
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
export type PReturnObj<T> = {result:T, remaining:string}
export type ParserResult<T> = Result.Type<PReturnObj<T>>

/**
 * May have to change the definition of ParserResult
export type PR<T> = Maybe<[T, string]> 
*/
export function makeParserResult<T>(r: T, rem: string) {
    return Result.makeResult({result: r, remaining: rem})
}
export function makeFailedParserResult<T>(code: string, rem: string): ParserResult<T> {
    return Result.makeFailedResult(code, rem)
}
export type Parser<T> = (sinput: string) => ParserResult<T>

function compose<X, Y>(f: (s:string) => X, g: (x:X) => Y): (s:string) => Y {
    return (s: string) => g(f(s))
}
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
            if(Result.isFailedResult(r1)) {
                return Result.makeFailedResult(r1.code, r1.rem)
            }
            const {result: a, remaining: b}: PReturnObj<A> = Result.getValue(r1)
            return makeParserResult(f(a), b)
        }
    }
}
/**
 * ## Parsers as a Monad
 * 
 * Step 1 define `eta` and `mu`
 */
export function eta<T>(t:T): P<T> {
    return (s: string) => makeParserResult(t, s)
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
        if(Result.isFailedResult(fs)) {
            const code = fs.code
            const rem = fs.rem
            const z = makeFailedParserResult<A>(fs.code, fs.rem)
            return z
        } else {
            const {result: p2, remaining: b} = Result.getValue(fs)
            // const r2 = p2(fs.rem)
            const r2 = p2(b)
            if(Result.isFailedResult(r2)) {
                const z = makeFailedParserResult<A>(r2.code, r2.rem)
                return z
            }
            const {result: d, remaining: h} = Result.getValue(r2)
            const r3 = makeParserResult(d,h)
            return r3
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
 * This function implements the "|" operator in a BNF notation.
 * 
 * It also makes the P monad into an `Alternative`
 */
export function choice<A>(p1: P<A>, p2: P<A>): P<A> {
    return (s: string) => Result.choice(p1(s), p2(s))
}

function test() {
    console.log(`hello`)
}

//@file_start junk.md
//@ignore_start
import * as Tree from "../tree"
type TNode = Tree.TreeNode
export function sameParserResult(label: string, actual: ParserResult<TNode>, expected: ParserResult<TNode>): boolean {
    if((!Result.isFailedResult(actual)) && (Result.isFailedResult(expected))) {
        console.log([`${label}: failed disagree re isNothing()`, 'expected is nothing', 'actual is not'])
        return false
    }
    if((Result.isFailedResult(actual) && (!Result.isFailedResult(expected)))) {
        console.log([`${label}: failed disagree re isNothing()`,'expected is NOT nothing','actual is nothing'])
        return false
    }
    if((!Result.isFailedResult(actual) && !Result.isFailedResult(expected))) {
        const {result: r1, remaining: rem1} = Result.getValue(actual)
        const {result: r2, remaining: rem2} = Result.getValue(expected)
        const s1 = Tree.treeAsString(r1)
        const s2 = Tree.treeAsString(r2)
        console.log(`actual exp: ${s1} expected exp: ${s2} OK: ${s1 === s2}`)
        return (s1.replace(/\s/g,"") === s2.replace(/\s/g,""))
    }
    const {code: c1, rem: rem1} = actual
    const {code: c2, rem: rem2} = expected
    const b = (c1 === c2) && (rem1 === rem2)
    if(!b) {
        console.log("`b is false")
    }
    console.log(`c1: ${c1} c2: ${c2} rem1: ${rem1} rem2: ${rem2} b:${b}`)
    return b
}
//@ignore_end
//@file_end

// test()