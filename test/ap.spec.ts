import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import * as ST from "../simple_test/simple_test"
import * as SP from "../src/final/primitives"
const alphas = SP.alphas
const numeric = SP.numeric
function display_one(s: string): string {
    // console.log(`display_one s: ${s}`)
    return `display_one ${s}`
}
function display_two(s1: string, s2: string): string {
    // console.log(`display_two ${s1} ${s2}`)
    return `${s1} + ${s2}`
}
function display_three(s1: string, s2: string, s3: string): string {
    // console.log(`display_three s: ${s1} ${s2} ${s3}`)
    return `display_three ${s1} + ${s2} + ${s3}`

}

function test_stuff() {
    // const x = liftA2<string, string, string>(display_strings)(alpha, alpha)
    const one = APP.pure(display_one)
    const two = APP.pure(display_two)
    const f = APP.ap<string, string>(one, alphas)
    const y = f("thisisastring")
    //console.log(y)
}
type P<T> = PT.P<T>
type AppFunctionType =  <A, B>(f: P<(x:A) => B>, pa: P<A>) => P<B>
/**
 * Tests the different implementations of the App.ap function.
 * And demonstrate that the App.ap function is the mechanism by which parsers can be applied
 * in sequence and a function applied to the results of each parser
 */
function define_ap_tests(test_ap: AppFunctionType) {
    /**
     * Apply a alphanmeric parse twice in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings 
     */
    ST.register("test_ap_2ary_01", () => {
        const test_input = "  this isast 2ring"
        const curried_display_two: (s: string) => (s2: string) => string = (s1: string) => {return (s2: string) => display_two(s1, s2)}
        const pure_curried_display_two: P<(s: string) => (s2: string) => string> = APP.pure(curried_display_two)
        const result = test_ap(
                        test_ap(
                            pure_curried_display_two, 
                            alphas
                        ), 
                        alphas
                    )(test_input)
        ST.assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        ST.assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
        //console.log(`test_ap_2ary_01 done`)
    })

    /**
     * Apply a alphanmeric parse and a numeric string parser in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings.
     * Note the second string is purely numeric 
     */
    ST.register("test_ap_2ary_02", () => {
        const test_input = "  this 2345 isast 2ring"
        const result = test_ap(test_ap(APP.pure((s1: string)=>(s2: string)=>display_two(s1, s2)), alphas), numeric)(test_input)
        //
        // oh how we would love to have infix operators as the above could be
        //
        // result = pure((s1: string)=>(s2: string)=>display_two(s1, s2)) <*> alphas <*> numeric
        //
        ST.assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        ST.assert(Maybe.get_value(result).value == "this + 2345", "liftA2 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " isast 2ring", "liftA2 test remaining input")
        //console.log(`test_ap_2ary_02 done`)
    })
    /**
     * Apply a alphanmeric parse and a numeric string parser in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings.
     * Note the second string is purely numeric.
     * This parse fails because the second string is not numeric
     */
    ST.register("test_ap_2ary_03", () => {
        const test_input = "  this isast 2ring"
        const curried_display_two: (s: string) => (s2: string) => string = (s1: string) => {return (s2: string) => display_two(s1, s2)}
        const pure_curried_display_two: P<(s: string) => (s2: string) => string> = APP.pure(curried_display_two)
        const result = test_ap(
                        test_ap(
                            pure_curried_display_two, 
                            alphas
                        ), 
                        numeric
                    )(test_input)
        ST.assert(Maybe.isNothing(result), "test liftA2 03 should fail")
        //console.log(`test_ap_2ary_03 done`)
    })
    /**
     * Demonstrate applying the alphanumeric parser three times in sequence.
     */
    ST.register("test_ap_3ary_01", () => {
        const test_input =   "this isast third 2ring"
        const curried_3ary = (s1:string) => (s2:string) => (s3:string)=>display_three(s1,s2,s3)
        const result = test_ap(test_ap(test_ap(APP.pure(curried_3ary), alphas), alphas), alphas)("  this isast third 2ring")
        ST.assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
        ST.assert(Maybe.get_value(result).value == "display_three this + isast + third", "test_ap_3ary_01 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
        //console.log(`test_ap_3ary_02 done`)
    })
    /**
     * Same as previous test except this time we apply a function to the three outcomees that does more than
     * print the results of each application. We print only the first and third outcomes
     */
    ST.register("test_ap_3ary_02", () => {
        const test_input =   "this isast third 2ring"
        const operation = (s1: string) => (s2: any) => (s3: string) => display_two(s1, s3)
        const result = test_ap(test_ap(test_ap(APP.pure(operation), alphas), alphas), alphas)("  this isast third 2ring")
        ST.assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
        ST.assert(Maybe.get_value(result).value == "this + third", "test_ap_3ary_01 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
        //console.log(`test_ap_3ary_02 done`)
    })
    /**
     * Apply three parsers in sequence to the input string. The first parser applied only succeeds 
     * if the first string is numeric. Since the first string is not numeric the entire 
     * sequence of parsers fails
     */
    ST.register("test_ap_3ary_03", () => {  
        const operation = (s1: string) => (s2: string) => (s3: string) => display_three(s1, s2, s3)  
        const test_input = "  aaa bbbb ccccc2ring"
        const result = test_ap(test_ap(test_ap(APP.pure(operation), numeric), alphas), alphas)(test_input)
        ST.assert(Maybe.isNothing(result), "test_ap_3ary_02 should fail")
        //console.log(`test_ap_3ary_03 done`)
    })
}
define_ap_tests(APP.ap_impl_naive)
define_ap_tests(APP.ap_impl_monad)
define_ap_tests(APP.ap_impl_liftA2)

if (typeof require !== 'undefined' && require.main === module) {
    ST.run()
}
