
abstract class Functor<T> {
    constructor() {

    }
    /**
     * Each instance must provide a static function of the following form
     *
     * static fmap<A,B>(f:(a:A) => B): (fs:Functor<A>) => Functor<B>;
    *
    */
}

abstract class Applicable<T> extends Functor<T> {
    constructor() {
        super()
    }
    /**
     * Every Must provide two additional static functions
     * 
     * 1. pure<T>(t: T): Applicable<T>;
     * 
     * 2. app<A,B>(at: Applicable<T>, f: (a: A) => B): Applicable<B>;
     * 
     * Given these 2 static functions you get this next one for free
     */
    liftA2<R,S,T>(f: (r: R, s: S) => T): (a: Applicable<R>, b: Applicable<S>) => Applicable<T> {
        const curriedf = (a:A) =>{return (b:B) => f(a,b)}    
        const fmap_curriedf = fmap((curriedf))
        const lifted_f = (pa: P<A>, pb: P<B>) => {
        return app(fmap_curriedf(pa), pb)
    }
    return lifted_f
    } 

}

abstract class Monad<T> extends Functor<T> {
    constructor() {
        super()
    }
    /**
     * Must provide two additional static functions
     * 
     * 1. eta<T>(t: T): Monad<T>;
     * 
     * 2. mu<T>(mmt: Monad<Monad<T>>): Monad<T>; 
     */
}