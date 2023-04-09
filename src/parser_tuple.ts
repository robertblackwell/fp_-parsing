/**
 * I started with this definition of PTuple<T>
 * 
 *      export type PTuple<T> = [T, string] 
 *
 * but soon realized it is not immutable and not opaque
*/

class PTupleClass<T> {
    private _value: T
    private _remaining_input: string
    private constructor(v: T, input: string) {
        this._value = v
        this._remaining_input = input
    }
    public static make<T>(v: T, input: string) {
        return new PTupleClass(v, input)
    }
    public get value() {
        return this._value
    }
    public get remaining_input() {
        return this._remaining_input
    }
}

export type PTuple<T> = PTupleClass<T>

export function make<T>(v: T, rem: string): PTuple<T> {return PTupleClass.make(v, rem)}
export function first<T>(tuple: PTuple<T>): T {return tuple.value}
export function get_value<T>(tuple: PTuple<T>): T {return tuple.value}
export function second<T>(tuple: PTuple<T>): string {return tuple.remaining_input}
export function get_remaining_input<T>(tuple: PTuple<T>): string {return tuple.remaining_input}
