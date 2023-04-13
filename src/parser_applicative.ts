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
export const ap = ap_impl_1
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
export function ap_impl_1<A, B>(f: P<(x:A) => B>, pa: P<A>): P<B> {
    const pp = (s:string) => {
        const fs = f(s)
        if(Maybe.isNothing(fs)) {
            return Maybe.nothing()
        } else {
            const justgsprime = Maybe.get_value(fs)
            const gg = PP.first(justgsprime)
            const g = PP.get_value(justgsprime)
            const sprime2 = PP.second(justgsprime)
            const sprime = PP.get_remaining_input(justgsprime)
            const pb = fmap(g)(pa)(sprime)
            return pb
        }
    }
    return pp
} 
export function ap_impl_2<A, B>(pf: P<(a:A) => B>, pa: P<A>): P<B> {
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
export function ap_impl_3<A, B>(pf: P<(a:A) => B>, pa: P<A>): P<B> {
    /**
     * liftA2 implemented using only <*> the alternative applicable definition
     * 
     * NOTE: something wrong must test
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
export const liftA2 = liftA2_impl_2
//
// WARNING
// ======
//          see comment near `ap` about workable choices for the implementations
//          of `ap` and `liftA2`
//
export function liftA2_impl_1<A, B, C>(f: (a: A, b: B) => C): (x: P<A>, y: P<B>) => P<C> {
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
            const sprime = PP.second(gpair)
            const gv = PP.first(gpair)
            // breaking gpair into components eg gpair = [gv, sprime]
            const hs = h(sprime) 
            if(Maybe.isNothing(hs)) {
                return Maybe.nothing()
            }
            const hpair = Maybe.get_value(hs)
            const sdoubleprime = PP.second(hpair)
            const hv = PP.first(hpair)
            // beaking hpair into components eg hpair = [hv, sdoubleprime]
            const cval = f(gv, hv)
            const result = Maybe.just(PP.make(cval, sdoubleprime))
            return result
        }
        return r
    }
    return lifted_f
}
export function liftA2_impl_2<A, B, C>(f: (a: A, b: B) => C): (x: P<A>, y: P<B>) => P<C> {
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

/*************************************************************
 * Tests
 *************************************************************/
function tests_mu() {
    function p1(s:string): PR.PResult<string> {
        return PP.make(s.substring(0,1), s.substring(1))
    }
    //
    // create an element of P<P<string>
    //
    function ppelement(sinput: string): PR.PResult<P<string>> {
        const f: P<string> = (s: string) => {
            if(sinput.substring(0,1) == s.substring(0,1)) {
                return Maybe.just(PP.make(sinput.substring(0,1), sinput.substring(1))) as PR.PResult<string>
            } else {
                return Maybe.nothing()
            }
        }
        const r = Maybe.just(PP.make(f, sinput.slice(0))) 
        return r
    }
    const x = mu<string>(ppelement)
    console.log("mu test done")
}
function test_apply() {
    /**
     * First some parsers to use in the `ap` tests. 
     * Will have 2 of them 
     * -    `alphas` - collect alphabetic caracters
     * -    `numeric` - collects digits
     * 
     * whitespace() is just so we can put a break between tokens
     */
    function whitespace(sinput: string): string {
        let s= sinput.slice(0)
        while((s.length > 0)&&(s.substring(0,1) == " ")) {
            s = s.slice(1)
        }
        return s
    }
    function make_parser_regex(regex: RegExp): P<string> {
        return function alphas(sinput: string): PR.PResult<string> {
            let s = whitespace(sinput)
            // const regex = /[A-Za-z]/g
            let result = ""
            while((s.length > 0) && (s.substring(0,1).match(regex))) {
                result = `${result}${s.substring(0,1)}`
                s = s.slice(1)
            }
            if(result != "") {
                return PP.make(result, s)
            } else {
                return Maybe.nothing()
            }
        }
    }
    const alphas = make_parser_regex(/[A-Za-z]/g)
    const numeric = make_parser_regex(/[0-9]/g)

    /**
     * Now we needs some operations of the form (s1: string, s2: string, ..., sn: string) => string
     * 
     * Will have 3 of them 
     * -    display_one     arity=1 op
     * -    display_two     arity=2 op
     * -    display_three   arity=3 op
     */

    function display_one(s: string): string {
        console.log(`display_one s: ${s}`)
        return `display_one ${s}`
    }
    function display_two(s1: string, s2: string): string {
        console.log(`display_two ${s1} ${s2}`)
        return `${s1} + ${s2}`
    }
    function display_three(s1: string, s2: string, s3: string): string {
        console.log(`display_three s: ${s1} ${s2} ${s3}`)
        return `display_three ${s1} + ${s2} + ${s3}`

    }
    /**
     * Now we need something to test the result
     */
    function assert(condition: boolean, msg: string) {
        if(!condition) {
            console.log(`assert failed msg: ${msg}`)
        }
    }
    function test_stuff() {
        // const x = liftA2<string, string, string>(display_strings)(alpha, alpha)
        const one = pure(display_one)
        const two = pure(display_two)
        const f = ap<string, string>(one, alphas)
        const y = f("thisisastring")
        console.log(y)
    }
    function test_lift()
    {
        // const ttwo = pure(Kurry2(two))
        // const ff = ap<string, (s: string)=>string>(ttwo, alpha)
        function test_liftA_01() {
            /**
             * parse two consecutive alpha strings
             */
            const test_input = "  this isast 2ring"
            const result: PR.PResult<string> = liftA2(display_two)(alphas, alphas)(test_input)
            assert(! Maybe.isNothing(result), "test liftA2 did not fail")
            assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
            assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
            // console.log(result)
            console.log("test_liftA2_01 done")
        }
        function test_liftA_02() {
            /**
             * parse an alpha followed by a numeric strings
             */
            const test_input = "  this 2345 isast 2ring"
            const result: PR.PResult<string> = liftA2(display_two)(alphas, numeric)(test_input)
            assert(! Maybe.isNothing(result), "test liftA2 02 did not fail")
            assert(Maybe.get_value(result).value == "this + 2345", "liftA2 02 test value")
            assert(Maybe.get_value(result).remaining_input == " isast 2ring", "liftA2 02 test remaining input")
            // console.log(result)
            console.log("test_liftA2_02 done")
        }
        function test_liftA_03() {
            /**
             * parse an alpha followed by a numeric strings but fail as no numeric
             */
            const test_input = "  this isast 2ring"
            const result: PR.PResult<string> = liftA2(display_two)(alphas, numeric)(test_input)
            assert(Maybe.isNothing(result), "test liftA2 03 should fail")
            console.log("test_liftA2_03 done")
        }
        test_liftA_01()
        test_liftA_02()
        test_liftA_03()
    }
    function test_ap_impls() {
        const test_ap = ap_impl_3
        /**
         * Test the different implimentations of ap
         */
        function test_apimpl_01() {
            // perform liftA2 uwsing `ap` - show each step in excruciating detail
            //
            // Note this is the same as test_lift_01
            //
            const test_input = "  this isast 2ring"
            const curried_display_two: (s: string) => (s2: string) => string = (s1: string) => {return (s2: string) => display_two(s1, s2)}
            const pure_curried_display_two: P<(s: string) => (s2: string) => string> = pure(curried_display_two)
            const result = test_ap(
                            test_ap(
                                pure_curried_display_two, 
                                alphas
                            ), 
                            alphas
                        )(test_input)
            assert(! Maybe.isNothing(result), "test liftA2 did not fail")
            assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
            assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
            console.log(`test_apimpl_01 done`)
        }
        test_apimpl_01()
    }
    
    function test_ap() {
        const test_ap = ap_impl_3
        /**
         * demonstrate the equivalence of, but differences between `ap` and `liftAn` 
         */
        function test_ap_2ary_01() {
            // perform liftA2 uwsing `ap` - show each step in excruciating detail
            //
            // Note this is the same as test_lift_01
            //
            const test_input = "  this isast 2ring"
            const curried_display_two: (s: string) => (s2: string) => string = (s1: string) => {return (s2: string) => display_two(s1, s2)}
            const pure_curried_display_two: P<(s: string) => (s2: string) => string> = pure(curried_display_two)
            const result = test_ap(
                            test_ap(
                                pure_curried_display_two, 
                                alphas
                            ), 
                            alphas
                        )(test_input)
            assert(! Maybe.isNothing(result), "test liftA2 did not fail")
            assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
            assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
            console.log(`test_ap_2ary_01 done`)
        }
        function test_ap_2ary_02() {
            // perform liftA2 uwsing `ap` - this time in more compact form
            //
            // Note this is the same as test_lift_02
            //
            const test_input = "  this 2345 isast 2ring"
            const result = test_ap(test_ap(pure((s1: string)=>(s2: string)=>display_two(s1, s2)), alphas), numeric)(test_input)
            //
            // oh how we would love to have infix operators as the above could be
            //
            // result = pure((s1: string)=>(s2: string)=>display_two(s1, s2)) <*> alphas <*> numeric
            //
            assert(! Maybe.isNothing(result), "test liftA2 did not fail")
            assert(Maybe.get_value(result).value == "this + 2345", "liftA2 test value")
            assert(Maybe.get_value(result).remaining_input == " isast 2ring", "liftA2 test remaining input")
            console.log(`test_ap_2ary_02 done`)
        }
        function test_ap_2ary_03() {
            // perform liftA2 uwsing `ap` - show each step in excruciating detail
            //
            // Note this is the same as test_lift_01
            //
            const test_input = "  this isast 2ring"
            const curried_display_two: (s: string) => (s2: string) => string = (s1: string) => {return (s2: string) => display_two(s1, s2)}
            const pure_curried_display_two: P<(s: string) => (s2: string) => string> = pure(curried_display_two)
            const result = test_ap(
                            test_ap(
                                pure_curried_display_two, 
                                alphas
                            ), 
                            numeric
                        )(test_input)
            assert(Maybe.isNothing(result), "test liftA2 03 should fail")
            console.log(`test_ap_2ary_03 done`)
        }
        function test_ap_3ary_01() {
            //
            // demonstrate how to do 3 place operations
            //
            const test_input =   "this isast third 2ring"
            const curried_3ary = (s1:string) => (s2:string) => (s3:string)=>display_three(s1,s2,s3)
            const result = test_ap(test_ap(test_ap(pure(curried_3ary), alphas), alphas), alphas)("  this isast third 2ring")
            assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
            assert(Maybe.get_value(result).value == "display_three this + isast + third", "test_ap_3ary_01 test value")
            assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
            console.log(`test_ap_3ary_02 done`)
        }    
        function test_ap_3ary_02() {
            //
            // demonstrate how to do 3 place operations - but this time leave out the 
            // 2nd parse result. This happens commonly in real situations. For example 
            // when the 2nd token is required to be a fixed string such as "*"
            //
            const test_input =   "this isast third 2ring"
            const operation = (s1: string) => (s2: any) => (s3: string) => display_two(s1, s3)
            const result = test_ap(test_ap(test_ap(pure(operation), alphas), alphas), alphas)("  this isast third 2ring")
            assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
            assert(Maybe.get_value(result).value == "this + third", "test_ap_3ary_01 test value")
            assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
            console.log(`test_ap_3ary_02 done`)
        }    
        function test_ap_3ary_03() {  
            const operation = (s1: string) => (s2: string) => (s3: string) => display_three(s1, s2, s3)  
            const test_input = "  aaa bbbb ccccc2ring"
            const result = test_ap(test_ap(test_ap(pure(operation), numeric), alphas), alphas)(test_input)
            assert(Maybe.isNothing(result), "test_ap_3ary_02 should fail")
            console.log(`test_ap_3ary_03 done`)
        }
        console.log("test_ap about to start")
        // test_ap_impls()
        test_ap_2ary_01()
        test_ap_2ary_02()
        test_ap_2ary_03()
        test_ap_3ary_01()
        test_ap_3ary_02()
        test_ap_3ary_03()
    }
    function test_do() {
        function div(a: number, b: number): Maybe.Maybe<number> {
            if( b > -0.1 && b < 0.1) 
                return Maybe.nothing()
            return Maybe.just(a / b)
        }
        function sum(a: number, b: number): number {
            return a + b
        } 
        /*
        * whenever one sees an unpacking of a Maybe<T> value to apply a fuunction to it
        * should think of using Maybe.bind. And in Haskell think "do {}"
        */
        function do_without_bind() {
            function combine(ma: Maybe.Maybe<number>, mb: Maybe.Maybe<number>): Maybe.Maybe<number> {
                if(Maybe.isNothing(mb)) {
                    return Maybe.nothing()
                } 
                if(Maybe.isNothing(mb)) {
                    return Maybe.nothing()
                }
                return div(Maybe.get_value(ma), Maybe.get_value(mb))
            }
            const ma = div(12, 2)
            const mb = div(12, 4)
            const mc = combine(ma, mb)
            assert(!Maybe.isNothing(mc), "do _without_bind_demo ! isNothing()")
            assert(Maybe.get_value(mc) == 2, "do _without_bind_demo assert value is 2")
            console.log(`do _without_bind_demo result is ${mc}`)

        }
        function test_do_01() {
            const ma = div(12, 2)
            const mb = div(12, 4)
            const mc = Maybe.bind(ma, (a) => Maybe.bind(mb, (b) => div(a,b)))
            assert(!Maybe.isNothing(mc), "test_do_01 assert ! isNothing()")
            assert(Maybe.get_value(mc) == 2, "test_do_01 assert value is 2")
            console.log(`test_do_01 result is ${mc}`)
        }
        function test_do_02() {
            const ma = div(6, 2)
            const mb = div(12, 4)
            const mc = Maybe.bind(ma, (a) => Maybe.bind(mb, (b) => Maybe.just(sum(a,b))))
            assert(!Maybe.isNothing(mc), "test_do_02 assert ! isNothing()")
            assert(Maybe.get_value(mc) == 6, "test_do_02 assert value is 6")
            console.log(`test_do_02 result is ${mc}`)
        }
        function test_do_03() {
            const ma = div(3, 0)
            const mb = div(12, 4)
            const mc = Maybe.bind(ma, (a) => Maybe.bind(mb, (b) => div(a,b)))
            assert(Maybe.isNothing(mc), "test_do_03 assert  isNothing() as expected")
            console.log(`test_do_03 result is ${mc}`)
        }
        test_do_01()
        test_do_02()
        test_do_03()
    }
    test_do()
    // test_lift()
    // test_ap()
}

// test_apply()

