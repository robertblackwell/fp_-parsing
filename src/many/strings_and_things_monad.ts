//@file_start maybe_v2.md
//@markdown_start
/*
# Strings and Things

In this section we are going to privide a quick digression into the __Parser Monad__ as it is typically 
presented in Haskell text books.

As you will see this presentation defines a parser inline with the rhyme

```
    A parser for things
 is a functions from strings
     to lists of pairs
   of things and strings
```

sp[ecifically:
*/
//@markdown_end
//@code_start
export type ParserResult<T> = [T, string][]
export type Parser<T> = (sinput: string) => ParserResult<T>

export function makeJustParserResult<T>(r: T, rem: string): ParserResult<T> {
    return [[r, rem]]
}
export function makeNothingParserResult<T>():ParserResult<T> {
    return []
}
export function isNothing<T>(r: ParserResult<T>): boolean {
    return r.length == 0
}

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
 * Apply a function f to the first component of the tuples in the array
 */
function listFmap<A,B>(f:(a:A)=>B, as:ParserResult<A>): ParserResult<B> {
    let bs: ParserResult<B> = []
    as.forEach(element => {
        const [a,b] = element
        const fa = f(a)
        const ne: [B, string] = [fa, b]
        bs.push(ne)
    });
    return bs
}

export function fmap<A,B>(f:(a:A)=>B): (p: Parser<A>) => Parser<B> {
    return function(p:Parser<A>): Parser<B> {
        return function(s:string): ParserResult<B> {
            const r1 = p(s)
            if(isNothing(r1)) {
                return makeNothingParserResult()
            }
            const [res1, rem1] = r1
            const rr: [B, string][] = listFmap(f, r1)
            return rr
        }
    }
}
/**
 * ## Parsers as a Monad
 * 
 * Step 1 define `eta` and `mu`
 */
export function eta<T>(t:T): Parser<T> {
    return function(s: string): ParserResult<T> {
        return [[t, s]]
    }
}

export function pure<A>(a: A): Parser<A> {
    return eta(a)
}

function bnd<A,B>(p: Parser<A>, k:(x:A) => Parser<B>): Parser<B> {
    return function(sinput: string): ParserResult<B> {
        let pb:[B, string][] = []
        p(sinput).forEach((element) => {
            const [a, csprime] = element
            const y: Parser<B> = k(a)
            const z: [B, string][] = y(csprime)
            pb = [...pb, ...z]
        })
        return pb
    }
} 

/**
 * Our parse type constructor is a Monad
 * 
 * `eta`: A -> Parser<A> is the same as `pure`
 * 
 * The trick is to make `mu`: Parser<Parser<A>> -> Parser<A>
 * 
 * Lets have a go at defining `mu` for the Parser Monad
 */

export function mu<A>(f: Parser<Parser<A>>): Parser<A> {
    const rr = function(s: string):ParserResult<A> {
        let res: [A, string][] = []
        const fs: [Parser<A>, string][] = f(s)
        fs.forEach((element) => {
            const [p, s] = element
            const ps: [A, string][] = p(s)
            res = [...res, ...ps]
        })
        return res
    }
    return rr
}

/**
 * ## Some derived monad characteristics
 */

/**
 * The `kliesli` function lifts a function A -> Parser<B> to a function Parser<A> -> Parser<B>.
 * 
 * The existence of this 'lifting' is an alternative way of specifying a monad.
 * 
 * Note: That with a `mu` already provided for the Parser Monad the 
 * definition of the `kliesli` function is completely general and hence the following
 * definition would work for ANY monad.
 * 
 * Also note the `mu: Parser<Parser<A>> -> Parser<A>` can be recovered from the `kliesli` function
 * as
 * ```
 *  `mu` : Parser<Parser<A>> -> Parser<A>` = `kliesli(identity: Parser<A> -> Parser<A>)`
 * ```
 */
export function kliesli<A,B>(f:(a: A) => Parser<B>): (pa: Parser<A>) => Parser<B> {
    const r1 = fmap(f)
    const result_function = (x:Parser<A>): Parser<B> => {
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
 * Also note that `mu: Parser<Parser<A>> -> Parser<A>` can be recovered from a `bind` operation
 * as follows:
 * 
 * First derive the `kliesli` function from the `bind` function as follows:
 * 
 * Consider `f: A -> Parser<B>` and define `kliesli(f): Parser<A> -> Parser<B>` as `\pa -> bind(pa, f)`.
 * 
 * Then `mu = kliesli(identity: Parser<A> -> Parser<A>)`
 * 
 */
export function bind<A,B>(pa: Parser<A>, f:(a:A) => Parser<B>) {
    return kliesli(f)(pa)
}

export function bindM2<A,B,C>(pa: Parser<A>, pb: Parser<B>, f:(a:A, b:B) => Parser<C>): Parser<C> {
    const r = bind(pa, (a:A) => bind(pb, (b: B) => f(a,b)))
    return r       
} 
export function bindM3<A,B,C, D>(pa: Parser<A>, pb: Parser<B>, pc: Parser<C>, f:(a:A, b:B, c: C) => Parser<D>): Parser<D> {
    const r = bind(pa, (a:A) => bind(pb, (b: B) => bind(pc, (c:C) => f(a,b,c))))
    return r       
} 

export function liftM2<A,B,C>(pa: Parser<A>, pb: Parser<B>, f:(a:A, b:B) => C): Parser<C> {
    const eta_f = (a: A, b: B) => {return eta(f(a, b))}
    return bindM2(pa, pb, eta_f)
}
export function liftM3<A,B,C, D>(pa: Parser<A>, pb: Parser<B>, pc: Parser<C>, f:(a:A, b:B, c: C) => D): Parser<D> {
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
export function apply<A,B>(f: Parser<F<A,B>>, x:Parser<A>): Parser<B> {
    const res = bind(f, (h) => bind(x, (a) => eta(h(a))))
    return res
}
/**
 * This function implements the "|" operator in a BNF notation.
 * and the <|> haskell operation
 * 
 * It also makes the P monad into an `Alternative`
 */
export function choice<A>(p1: Parser<A>, p2: Parser<A>): Parser<A> {
    return function(s: string): ParserResult<A> {
        const r1 = p1(s)
        // take the first result
        return (r1.length === 0) ? p2(s) : [r1[0]]
    }
}
