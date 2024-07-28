type State<S, A> = (s:S) => [S, A]

function fmap<S, A, B>(f: (a:A) => B): (x: State<S, A>) => State<S, B> {
    return function(x: State<S, A>): State<S, B> {
        return function(s: S): [S, B] {
            const [y1, y2] = x(s)
            return [y1, f(y2)] 
        }
    }
}

function eta<S, A>(a: A): State<S, A> {
    return function (s: S): [S, A] {
        return [s, a]
    }
}

function mu<S,A>(x: State<S, State<S,A>>): State<S,A> {
    return function(s: S): [S, A] {
        const [w0, w1] = x(s)
        const [z0, z1] = w1(w0)
        return [z0, z1]
    }
}

function bind<S, A, B>(x: State<S,A>, f: (a:A) => State<S,B>): State<S, B> {
    const ff = fmap<S, A, State<S,B>>(f)
    const w: State<S,B> = mu(ff(x))
    return w
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
function apply<S,A,B>(f:State< S, F<A,B>>, x: State<S,A>): State<S,B> {
    const res = bind(f, (h) => bind(x, (a) => eta(h(a))))
    return res
}

function liftM2<S, A,B,C>(f: (a:A, b:B) => C): (x: State<S,A>, y: State<S,B>) => State<S,C> {
    return function(x: State<S,A>, y: State<S,B>): State<S, C> {
        return bind(x, (a) => bind(y, (b) => eta(f(a,b))))
    }
}