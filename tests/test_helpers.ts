import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"

export type P<T> = APP.P<T>

/**
 * Now we need something to test the result
 */
export function assert(condition: boolean, msg: string) {
    if(!condition) {
        console.log(`assert failed msg: ${msg}`)
    }
}
/**
 * First some parsers to use in the `ap` tests. 
 * Will have 2 of them 
 * -    `alphas` - collect alphabetic caracters
 * -    `numeric` - collects digits
 * 
 * whitespace() is just so we can put a break between tokens
 */
export function whitespace(sinput: string): string {
    let s= sinput.slice(0)
    while((s.length > 0)&&(s.substring(0,1) == " ")) {
        s = s.slice(1)
    }
    return s
}
export function make_parser_regex(regex: RegExp): P<string> {
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
export const alphas = make_parser_regex(/[A-Za-z]/g)
export const numeric = make_parser_regex(/[0-9]/g)

/**
 * Now we needs some operations of the form (s1: string, s2: string, ..., sn: string) => string
 * 
 * Will have 3 of them 
 * -    display_one     arity=1 op
 * -    display_two     arity=2 op
 * -    display_three   arity=3 op
 */

export function display_one(s: string): string {
    console.log(`display_one s: ${s}`)
    return `display_one ${s}`
}
export function display_two(s1: string, s2: string): string {
    console.log(`display_two ${s1} ${s2}`)
    return `${s1} + ${s2}`
}
export function display_three(s1: string, s2: string, s3: string): string {
    console.log(`display_three s: ${s1} ${s2} ${s3}`)
    return `display_three ${s1} + ${s2} + ${s3}`

}

