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



/**
 * Claim that the "type constructor" PT.ParserType<T> is an applicative functor.
 * 
 * Below we will demonstrate
 */

export type P<T> = PT.ParserType<T>

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
        const g = just_g_sprime.value//PP.first(just_g_sprime)
        const sprime = just_g_sprime.remaining_input//PP.second(just_g_sprime)
        const pb =fmap(g)(a)(sprime)
        return pb
    } 
    return result
}
// This is to do with Alternative typeclass
// https://stackoverflow.com/questions/26002415/what-does-haskells-operator-do
// and requires definitng a <|> operator
//
// which provides a definition of `some` and `many`
// instance Alternative Maybe where
// empty = Nothing
// Nothing <|> r = r
// l       <|> _ = l
//
// many x = some x <|> pure []
// some x = pure (:) <*> x <*> many x
//
// needs a lot of elaborating before it is understandable
//
// Another reference for alternative
//https://en.wikibooks.org/wiki/Haskell/Alternative_and_MonadPlus
//
//https://math.stackexchange.com/questions/4306514/what-makes-every-strong-monad-on-a-certain-category-be-a-monoidal-functor
// https://www.cse.unsw.edu.au/~cs3141/22T2/Week%2007/Lecture/Slides.pdf
// unsw monad is an applicative
// 
// Monads are applicatives
// https://nforum.ncatlab.org/discussion/13684/when-a-strong-monad-becomes-a-monoidal-functor/
//
// IMportant reference on the equivalence of liftA2 and app
// https://en.wikipedia.org/wiki/Monoidal_functor
//
// The following link shows that is a closed monoidal category 
// the notionals of a lax-monoidal functor and a lax closed functor are
// equivalent. Which is exactly what the two definitionas of applicative correspond to
//https://ncatlab.org/nlab/show/closed+functor
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
//
// A note on the calculation below. I did this calc before I realized P<> is a monad.
// Once we know that then we can use the fact that every Monad is applicative.
// Lets detail how to show that which will give a generic calculation for `ap`
//
//  We need to define: 
//  ap :: A -> P<A -> B> -> P<B>
//
//  start with
//  eval :: A -> ((A->B) -> P<B>)  
//  \a -> \f -> eta(f(a))
//
// apply fmap 
// fmap(eval) :: P<A> -> P<A->B> -> P<P<B>>, composed with
// mu :: P<P<B>> -> P<B>, resulting in a function 
//
// \x -> \y ->       
//  
// 
/**
 * In Haskell notation this is the function
 * 
 * (<*>) P(A -> B) -> P A -> P B 
 */
// function ap<A, B>(f: P<(x:A) => B>, pa: P<A>): P<B> {
//     return ap_impl_2(f, pa)
// }
export const ap = ap_impl_naive
/**
 *  WARNING: 
 * ========= 
 * 
 * 
 * NOTE: there are 3 implementations of `ap`.
 * 1. The first uses details of the P<> type constructor
 * and is useful if you want to see what is happening
 * under the hood.
 * 
 * 2. Second implementation `ap` is using the monad primitives
 * and `ap_impl_2` does that. 
 * 
 * 3. WARNING - the final implementation is using the relationship between `ap`
 * and `liftA2`. BUT there is an implementation of `liftA2` in terms of `ap`
 * choosing
 *      ap = ap_impl_3  and liftA2 = liftA2_impl_2
 * 
 * will make `ap` and `liftA2` mutually recursive and will cause a stack
 * over flow.
 * 
 * Recommended combinations:
 *  
 *      ap = ap_impl_1 and liftA2 = liftA2_impl_2
 * 
 */
export function ap_impl_naive<A, B>(f: P<(x:A) => B>, pa: P<A>): P<B> {
    const pp = (s:string) => {
        const fs = f(s)
        if(Maybe.isNothing(fs)) {
            return Maybe.nothing()
        } else {
            const justgsprime = Maybe.get_value(fs)
            const gg = justgsprime.value//PP.first(justgsprime)
            const g = justgsprime.value//PP.get_value(justgsprime)
            const sprime2 = justgsprime.remaining_input//PP.second(justgsprime)
            const sprime = justgsprime.remaining_input //PP.get_remaining_input(justgsprime)
            const pb = fmap(g)(pa)(sprime)
            return pb
        }
    }
    return pp
} 
export function ap_impl_monad<A, B>(pf: P<(a:A) => B>, pa: P<A>): P<B> {
    /**
     * liftA2 implemented using monad primitives
     */
    const h = (pa: P<A>) => {
        const g = (f: (a:A) => B) => {
            const return_fab = (x:A) => eta(f(x))
            return bind(pa, return_fab)
        }
        return g
    }
    /** 
     * the following lines of code remain in case I (or you) need to do a type analysis
     * vscode is very good at letting one check that calculations are producing
     * values with the expected type
    */
   // type X = (a:A) => B
    // type Y = P<(a:A) => B>
    // const tmp = h(pa)
    // const tmp2 = kliesli(h(pa))
    // const tmp3 = kliesli(h(pa))(pf)
    /**
     * I prefer to use the kliesli equivalence
     * but have given both computations for completeness 
     */
    const bindvalue = bind(pf, h(pa)) // pf >>= h(pa) is pf <*> pa 
    return kliesli(h(pa))(pf)
}
export function ap_impl_liftA2<A, B>(pf: P<(a:A) => B>, pa: P<A>): P<B> {
    /**
     * liftA2 implemented using only <*> the alternative applicable definition
     * (<*>) = lift id
     * @TODO NOTE: something wrong must test
     */
    const uncurried_id = (f: (x:A) => B, a:A) => f(a)
    const lifted_id = liftA2(uncurried_id)
    return lifted_id(pf, pa)
}

 /**
 * The liftAn functions
 * =====================
 * Another way to define an applicative is to demonstrate that any 
 * operation f: A x B -> C lifts to a function P<A> x P<B> -> P<C>
 * where the 'x' is cartesian product.
 * 
 * This 'lift' function is called 'liftA2' 
 * 
 * A special application of liftA2 is
 * 
 *  liftA2(identity:AxB -> AxB) : P<A> x P<B> -> P<AxB>
 * 
 * Thus liftA2(f)(a,b) = fmap(f)(liftA2(identity:AxB -> AxB)(a,b))  
 * 
 * liftA3: (AxBxC -> D) -> P<A> x P<B> x P<C> -> P<D> 
 * 
 * Combining liftA2 we can make liftAn for any n >= 2. Lets see that for n=3 and
 * g: AxBxC->D
 * 
 * Composing the following 2 functions:
 * 
 * idA x liftA2(id:BxC->BxC): P<A> x P<B> x P<C> -> P<A> x P<BxC>
 * liftA2(id:Ax(BxC) -> Ax(BxC)) : P<A> x P<BxC> -> P<AxBxC>
 * 
 * gives a function:
 * 
 * P<A> x P<B> x P<C> -> P<AxBxC>
 * 
 * which is by definition liftA3(identity: AxBxC->AxBxC)
 * 
 * and liftA3(f: AxBxC->D) = fmap(f)(liftA3(id:AxBxC->AxBxC))
 * 
 * apply function and its relationship to liftAn
 * ==============================================
 * 
 * Above we have defined 2 functions `apply` and `app` which are the same. How do these relate to liftAn
 * 
 * liftA2(f: AxB -> C)(a,b) = apply(apply(pure(f), a), b)
 * 
 * Haskell programmers like to write `apply` as an infix operator `<*>` so the above becomes
 * 
 * liftA2(f)(a,b) = pure(f)<*>a<*>b
 * 
 * Using this stuff
 * ================
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
//  function liftA2<A, B, C>(f: (a: A, b: B) => C): (x: P<A>, y: P<B>) => P<C> {
//     return liftA2_impl_2(f)
// }
export const liftA2 = liftA2_impl_ap
//
// WARNING
// ======
//          see comment near `ap` about workable choices for the implementations
//          of `ap` and `liftA2`
//
export function liftA2_impl_naive<A, B, C>(f: (a: A, b: B) => C): (x: P<A>, y: P<B>) => P<C> {
    /**
     * TODO : give a generic implementation of lift using bind
    */
    function lifted_f(g: P<A>, h:P<B>) {
        const r = (s: string) => {
            const gs = g(s)
            if(Maybe.isNothing(g(s))) {
                return Maybe.nothing()
            } 
            const gpair = Maybe.get_value(gs)
            const sprime = gpair.remaining_input//PP.second(gpair)
            const gv = gpair.value//PP.first(gpair)
            // breaking gpair into components eg gpair = [gv, sprime]
            const hs = h(sprime) 
            if(Maybe.isNothing(hs)) {
                return Maybe.nothing()
            }
            const hpair = Maybe.get_value(hs)
            const sdoubleprime = hpair.remaining_input//PP.second(hpair)
            const hv = hpair.value//PP.first(hpair)
            // beaking hpair into components eg hpair = [hv, sdoubleprime]
            const cval = f(gv, hv)
            const result = Maybe.just(PP.make(cval, sdoubleprime))
            return result
        }
        return r
    }
    return lifted_f
}
export function liftA2_impl_ap<A, B, C>(f: (a: A, b: B) => C): (x: P<A>, y: P<B>) => P<C> {
    /**
     * Implemented using the alternative application operation `ap` or `<*>`
     */
    const curriedf = (a:A) =>{return (b:B) => f(a,b)}    
    const fmap_curriedf = fmap((curriedf))
    const lifted_f = (pa: P<A>, pb: P<B>) => {
        return ap(fmap_curriedf(pa), pb)
    }
    return lifted_f
}

export function liftA2_impl_monad<A, B, C>(f: (a: A, b: B) => C): (x: P<A>, y: P<B>) => P<C> {

    function r(x: P<A>, y: P<B>): P<C> {
        return  bind(x, (a) => (bind(y, (b) => eta(f(a,b)))))
    }
    return r
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
 * Lets have a go.
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
 * This is the haskell function 
 * (>>=) :: m a -> (a -> m b) -> m b
 */
export function bind<A,B>(pa: P<A>, f:(a:A) => P<B>) {
    return kliesli(f)(pa)
}

