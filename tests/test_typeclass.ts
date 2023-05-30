/**
 * In this project the goal is to use Categorical concepts like Functor, Applicative and Monad 
 * from Haskell to implement a parser for arithmetic expressions in Typescript. Haskell implements such 
 * concepts as Type Classes. How should we implement them in Typescript?
 * 
 * What is needed:
 * 
 * -    A generic type, for example `Maybe<T>`
 * -    A number of functions or class static member functions. For example `Maybe.just()`. Ideally we would like
 * to be able to have the compiler check that all required functions are provided and have the correct signature.
 * -    Maybe some type/class member fuunctions. Again we would like to have the compiler check that the required
 * functions are provided and hve the correct signature.
 * 
 * An obvious solution is to make `Functor`, `Applicable`, `Monad` etc as generic classes with specified
 * static and member functions.
 * 
 * For example we could define the `Maybe` monad as:
 * 
 * ```ts
 */ 
  
abstract class Functor<T> {
    abstract static make<T>(t: T): Monad<T>
    abstract static fmap<T,S>(f:(t:T) => S): (mt: Monad<T>) => Monad<S>;

}
abstract class Monad<T> extends Functor<T>{ 
    abstract static pure<T>(t: T): Monad<T>;
    abstract static mu<T>(tt: Monad<Monad<T>>): Monad<T>;
    static kliesli<T,S>(f:(t: T) => Monad<S>): (mt: Monad<T>) => Monad<S> {
        return (mt: Monad<T>) => {
            return Monad.mu(this.fmap(f)(mt))
        }
    }
    static bind<T, S>(mt: Monad<T>, f: (s: S) => Monad<T>): Monad<T> {
        return Monad.kliesli(f)(mt)
    }
}

class Maybe<T> extends Monad<T> {
    value: T | null
    constructor() {
        super()
        this.value = null
    }
    static make<T>(t: T): Maybe<T> {
        let obj = new Maybe<T>()
        obj.value = t;
        return obj
    }
    static fmap<A, B>(f:(a:A) => B): (ma: Maybe<A>) => Maybe<B> {
        return (ma) => {
            if(Maybe.isNothing(ma)) {
                return Maybe.nothing()
            } else {
                return Maybe.make(f(Maybe.get_value(ma)))
            }
        }
    }
    static nothing<T>(): Maybe<T> {
        return new Maybe<T>()
    }
    static isNothing<T>(tm: Maybe<T>): boolean {
        return (tm.value == null)
    }
    static get_value<T>(v: Maybe<T>): T {
        if(v.value == null) {
            throw new Error(`cannot get value of nothing`)
        }
        return v.value as T
    }
    //.... plsu implementations of
    static pure<T>(t: T): Monad<T> {
        return Maybe.make(t)
    }
    static mu<T>(tt: Maybe<Maybe<T>>): Maybe<T> {
        if(Maybe.isNothing(tt)) {
            return Maybe.nothing()
        }
        return Maybe.get_value(tt)
    }
}
export function test() {
    
}
if (typeof require !== 'undefined' && require.main === module) {
    test();
}
