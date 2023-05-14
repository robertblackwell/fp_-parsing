/**
 * A monad is:
 * -    a type constructor we will call `M`, that is a generic type with a single argument, 
 * -    together with a set of free functions (that is not methods of a class).
 *      They are:
 *          `fmap(f:(a: A) => B): (ma: M<A>) => M<B>`
 * 
 *          `eta(a: A): M<A>`
 *          `mu(mma: M<M<A>>): M<A>)`
 *          `kliesli((f:(a: A) => M<B>): (ma: M<A>) => M<B>`
 *          `bind(ma: M<A>, f:(a: A) -> B): M<B>`
 *          `liftA2:(f:(a:A, b:B) => C): (ma:M<A>, mb: M<B>) => M<C>
 *          `app(f:(a:A) => B, ma: M<A>): M<B>
 *          
 *      -   not all of these functions are independent, in that some can
 *          be derived from the others.
 * 
 *      -   in this project we will require `fmap`, `eta` and `mu` to be provided
 *          for each instance of a monad and the others will be derived from those. 
 * 
 */

export  abstract class M<A> {

}
abstract class MonadKernel<A> {
    abstract  fmap<A, B>(f:(a: A) => B): (ma: M<A>) => M<B>;

}
abstract class MF<A> {
    abstract fmap<A, B>(f:(a: A) => B): (ma: M<A>) => M<B>;
    abstract eta<A>(a: A): M<A>;
    abstract mu<A>(mma: M<M<A>>): M<A>;
        
    kliesli<A,B>(f:(a: A) => M<B>): (ma: M<A>) => M<B> {
        const r1 = this.fmap(f)
        const result_function = (x:P<A>): P<B> => {
            const z1 = this.fmap(f)(x)
            const z2 = this.mu(z1)
            return z2
        }
        return result_function
    }
    /**
     * This is the Haskell `>>=` operation
     */
    bind<T,S>(x: M<T>, f: (t:T) => M<S>): M<S> {
        return this.kliesli(f)(x)
    }
    /**
     * This is the Haskell `<*>` operation and is part of the proof that every Monad
     * is an applicative
     */
    app<A, B>(pf: M<(a:A) => B>, pa: M<A>): M<B> {
        const h = (pa: M<A>) => {
            const g = (f: (a:A) => B) => {
                const return_fab = (x:A) => this.eta(f(x))
                return this.bind(pa, return_fab)
            }
            return g
        }
        const bindvalue = this.bind(pf, h(pa)) // pf >>= h(pa) is pf <*> pa 
        return this.kliesli(h(pa))(pf)
    }
    /**
     * This is one of the key applicative functions and the details prove that
     * the existence of an `<*>` operation implies the existence of the `liftA2` function. 
     */
    liftA2<A, B, C>(f: (a: A, b: B) => C): (x: M<A>, y: M<B>) => M<C> {
        const curriedf = (a:A) =>{return (b:B) => f(a,b)}    
        const fmap_curriedf = this.fmap((curriedf))
        const lifted_f = (pa: M<A>, pb: M<B>) => {
            return this.app(fmap_curriedf(pa), pb)
        }
        return lifted_f
    }
    /**
     * And this is the proof the the existence of `liftA2` implies the existence of `<*>`
     */
    app_another<A, B>(pf: M<(a:A) => B>, pa: M<A>): M<B> {
        /**
         * liftA2 implemented using only <*> the alternative applicable definition
         * 
         * @TODO NOTE: something wrong must test
         */
        const uncurried_id = (f: (x:A) => B, a:A) => f(a)
        const lifted_id = this.liftA2(uncurried_id)
        return lifted_id(pf, pa)
    }
}

    class Optional<T> extends M<T> {
        value: T | null
        constructor() {
            super()
            this.value = null
        }
        isNothing<T>(): boolean {
            return this.value == null
        }
        static make(v: T): Optional<T> {
            let obj = new Optional()
            obj.value = v
            return obj
        }
        static nothing() {
            return new Optional()
        }
        just<T>(v: T) {
            let obj = new Optional()
            obj.value = v
            return obj
        }
        getValue<T>(): T {
            return this.value as T
        }
    }
    abstract class OptionalF<T> extends MF<T> {
        fmap<U>(f:(a: T) => U): (ma: M<T>) => M<U> {
            const ff = (ma: Optional<T>) => {
                if(ma.isNothing()) {
                    return Optional.nothing() as Optional<U>
                } else {
                    const vv = Optional.make(f(ma.getValue()))
                    return vv as Optional<U>
                }
            }
            return (ff as any) as ((ma: M<T>) => M<U>)
        }

        eta<A>(a: A) {
            let obj = new Optional<A>()
            obj.value = a
            return obj
        }
    }