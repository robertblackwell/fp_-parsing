// interface Functor<T> {
//     static fmap<A, B>(f:(a:A) => B): (fa: Functor<A>) => Functor<B>
// }

// interface Applicative<T> {
//     pure<A>(a:A): Applicative<A>
// }


class Base1 {
    constructor(){

    }
    static static2(): void {
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
        this.staticfunction2(7)
        console.log(`static2`)
    }
    static staticfunction1(i) {
        console.log(`Base1 i: ${i}`)
    }
}

class Fred extends Base1 {
    constructor() {
        super()
        this.f = 1
    }
    static staticfunction2(i) {
        let xx = Object.getPrototypeOf(this)
        this.staticfunction1(i)
        let obj = new Fred()
        this.f = i
        return obj
    }
}

let x = new Fred()
Fred.static2()
Fred.staticfunction1(4)
Fred.staticfunction2(3)
console.log(Fred)
console.log(Fred, x)