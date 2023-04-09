import * as PP from "./parser_pair"
import * as PR from "./parser_result"
import * as PT from "./parser_type"
import * as Maybe from "./maybe"

/**
 * Claim that the "type constructor" PT.ParserType<T> is an applicative functor.
 * 
 * Below we will demonstrate
 */

type P<T> = PT.ParserType<T>

function compose<X, Y>(f: (s:string) => X, g: (x:X) => Y): (s:string) => Y {
    return (s: string) => g(f(s))
}

export function fmap<A,B>(f:(a:A)=>B): (p: P<A>) => P<B> {
    const f2 = Maybe.fmap(PP.fmap(f))
    return function k(p: P<A>) {return compose(p, f2)}
}

/**
 * Define pure pure: T => P<T>
 */
export function pure<T>(t:T): P<T> {
    return (s: string) => Maybe.just(PP.make(t, s))
}
function apply<A, B>(a: P<A>, f: P<(a:A) => B>): P<B> {
    const result = (s: string): PR.PResult<B> => {
        const fs = f(s)
        if(Maybe.isNothing(fs)) {
            return Maybe.nothing()
        } 
        const just_g_sprime = Maybe.get_value(fs)
        const g = PP.first(just_g_sprime)
        const sprime = PP.second(just_g_sprime)
        const pb =fmap(g)(a)(sprime)
        return pb
    } 
    return result
}

//
// There are other ways to definean applicative - here is one which uses a definition of
// parser which is analogous to the one used here
//
// https://cs.pomona.edu/~michael/courses/csci131s17/lec/Lec11.html
// instance Applicative Parser where
//   pure a = Parser $ \s -> Just (a,s)
//   f <*> a = Parser $ \s ->  -- f :: Parser (a -> b), a :: Parser a
//     case parse f s of
//       Nothing -> Nothing
//       Just (g,s') -> parse (fmap g a) s' -- g :: a -> b, fmap g a :: Parser b
//
// Lets try this

function ap<A, B>(f: P<(x:A) => B>, a: P<A>): P<B> {
    const pp = (s:string) => {
        const fs = f(s)
        if(Maybe.isNothing(fs)) {
            return Maybe.nothing()
        } else {
            const justgsprime = Maybe.get_value(fs)
            const g = PP.first(justgsprime)
            const sprime = PP.second(justgsprime)
            const pb = fmap(g)(a)(sprime)
            return pb
        }
    }
    return pp
} 

/**
 * Another way to defione an applicative is to demonstrate that any 
 * operation f: A x B -> C lifts to a function P<A> x P<B> -> P<C>
 * where the 'x' is cartesian product.
 * 
 * The 'lift' function is called 'liftA2' 
 * 
 * Combining liftA2 we can make liftAn for any n >= 2
 * 
 * After working through the definition - this looks very much like sequence
 * 
 * Consider three parsers 
 *      parse_openbracket:: string -> ParserResultAst
 *      parse_expression:: string -> ParserResultAst
 *      parse_closebracket:: string -> ParserResultAst
 *  
 * and a 3-ary operation f: (a: Ast, b: Ast, c: Ast) => BracketNode.make(b)
 * 
 * Then liftA3(f)(parse_openbracket, parse_expression, parse_closebracket)
 * 
 * is a parser for the bnf factor ::= ( exp )
 * 
 */
function liftA2<A, B, C>(f: (a: A, b: B) => C): (x: P<A>, y: P<B>) => P<C> {
    function lifted_f(g: P<A>, h:P<B>) {
        const r = (s: string) => {
            const gs = g(s)
            if(Maybe.isNothing(g(s))) {
                return Maybe.nothing()
            } 
            const gpair = Maybe.get_value(gs)
            const sprime = PP.second(gpair)
            const gv = PP.first(gpair)
            // gpair = [gv, sprime]
            const hs = h(sprime) 
            if(Maybe.isNothing(hs)) {
                return Maybe.nothing()
            }
            const hpair = Maybe.get_value(hs)
            const sdoubleprime = PP.second(hpair)
            const hv = PP.first(hpair)
            // hpair = [hv, sdoubleprime]
            const cval = f(gv, hv)
            const result = Maybe.just(PP.make(cval, sdoubleprime))
            return result
        }
        return r
    }
    return lifted_f
}

/**
 * Our parse type constructor is a Monad
 * 
 * `eta`: A -> P<A> is the same as `pure`
 * 
 * The trick is to make `mu`: P<P<A>> -> P<A>
 * 
 * Lets have a go
 */

function mu<A>(f: P<P<A>>): P<A> {
    const rr = (s: string) => {
        const fs = f(s)
        if(Maybe.isNothing(fs))
            return Maybe.nothing()
        const ftuple = Maybe.get_value(fs)
        const fv = PP.get_value(ftuple)
        const fstr = PP.get_remaining_input(ftuple)
        const r = fv(fstr)
        return r
    }
    return rr
}


