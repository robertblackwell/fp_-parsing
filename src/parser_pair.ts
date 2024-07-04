/**
 * I started with this definition of PPair<T>
 * 
 *      export type PPair<T> = [T, string] 
 *
 * but soon realized it is not immutable and not opaque. 
 * What I want is an immutable pair where there is no direct access to the
 * members. Also I wanted the "parser failed" to be implemented as a Maybe Monad
 * not by some special value within the PPair<> type
 * 
 * So the following class based solution seems better
*/

class PPairC<T> {
    private _value: T
    private _remaining_input: string
    private constructor(v: T, input: string) {
        this._value = v
        this._remaining_input = input
    }
    public static make<T>(v: T, input: string) {
        return new PPairC(v, input)
    }
    public get value() {
        return this._value
    }
    public get remaining_input() {
        return this._remaining_input
    }
    // public static first<T>(tuple: PPair<T>): T {return tuple._value}
    // public static second<T>(tuple: PPair<T>): string {return tuple._remaining_input}
    // public static get_value<T>(tuple: PPair<T>): T {return tuple._value}
    // public static get_remaining_input<T>(tuple: PPair<T>): string {return tuple._remaining_input}
    // public static fmap<A,B>(f:(a:A) => B) {
    //         return (x:PPair<A>) => this.make(f(this.first(x)), this.second(x) ) 
    // }
}

export type PPair<T> = PPairC<T>

export function make<T>(v: T, rem: string): PPair<T> {return PPairC.make(v, rem)}
// export function first<T>(tuple: PPair<T>): T {return tuple.value}
export function get_value<T>(tuple: PPair<T>): T {return tuple.value}
// export function second<T>(tuple: PPair<T>): string {return tuple.remaining_input}
export function get_remaining_input<T>(tuple: PPair<T>): string {return tuple.remaining_input}

export function fmap<A,B>(f:(a:A) => B) {
    return (x:PPair<A>) => make(f(x.value), x.remaining_input ) 
}