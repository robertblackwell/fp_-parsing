import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import {P, assert, display_one, display_two, display_three, alphas, numeric} from "../tests/test_helpers"
import * as T from "../tests/test_helpers"

function test_stuff() {
    // const x = liftA2<string, string, string>(display_strings)(alpha, alpha)
    const one = APP.pure(display_one)
    const two = APP.pure(display_two)
    const f = APP.ap<string, string>(one, alphas)
    const y = f("thisisastring")
    console.log(y)
})
type AppFunctionType =  <A, B>(f: P<(x:A) => B>, pa: P<A>) => P<B>
/**
 * Tests the different implementations of the App.ap function.
 * And demonstrate that the App.ap function is the mechanism by which parsers can be applied
 * in sequence and a function applied to the results of each parser
 */
function test_ap_implementations() {
    /**
     * Apply a alphanmeric parse twice in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings 
     */
    function test_ap_2ary_01(test_ap: AppFunctionType) {
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
        assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
        assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
        console.log(`test_ap_2ary_01 done`)
    }

    /**
     * Apply a alphanmeric parse and a numeric string parser in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings.
     * Note the second string is purely numeric 
     */
    function test_ap_2ary_02(test_ap: AppFunctionType) {
        const test_input = "  this 2345 isast 2ring"
        const result = test_ap(test_ap(APP.pure((s1: string)=>(s2: string)=>display_two(s1, s2)), alphas), numeric)(test_input)
        //
        // oh how we would love to have infix operators as the above could be
        //
        // result = pure((s1: string)=>(s2: string)=>display_two(s1, s2)) <*> alphas <*> numeric
        //
        assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        assert(Maybe.get_value(result).value == "this + 2345", "liftA2 test value")
        assert(Maybe.get_value(result).remaining_input == " isast 2ring", "liftA2 test remaining input")
        console.log(`test_ap_2ary_02 done`)
    }
    /**
     * Apply a alphanmeric parse and a numeric string parser in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings.
     * Note the second string is purely numeric.
     * This parse fails because the second string is not numeric
     */
    function test_ap_2ary_03(test_ap: AppFunctionType) {
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
        assert(Maybe.isNothing(result), "test liftA2 03 should fail")
        console.log(`test_ap_2ary_03 done`)
    }
    /**
     * Demonstrate applying the alphanumeric parser three times in sequence.
     */
    function test_ap_3ary_01(test_ap: AppFunctionType) {
        const test_input =   "this isast third 2ring"
        const curried_3ary = (s1:string) => (s2:string) => (s3:string)=>display_three(s1,s2,s3)
        const result = test_ap(test_ap(test_ap(APP.pure(curried_3ary), alphas), alphas), alphas)("  this isast third 2ring")
        assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
        assert(Maybe.get_value(result).value == "display_three this + isast + third", "test_ap_3ary_01 test value")
        assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
        console.log(`test_ap_3ary_02 done`)
    }    
    /**
     * Same as previous test except this time we apply a function to the three outcomees that does more than
     * print the results of each application. We print only the first and third outcomes
     */
    function test_ap_3ary_02(test_ap: AppFunctionType) {
        const test_input =   "this isast third 2ring"
        const operation = (s1: string) => (s2: any) => (s3: string) => display_two(s1, s3)
        const result = test_ap(test_ap(test_ap(APP.pure(operation), alphas), alphas), alphas)("  this isast third 2ring")
        assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
        assert(Maybe.get_value(result).value == "this + third", "test_ap_3ary_01 test value")
        assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
        console.log(`test_ap_3ary_02 done`)
    }
    /**
     * Apply three parsers in sequence to the input string. The first parser applied only succeeds 
     * if the first string is numeric. Since the first string is not numeric the entire 
     * sequence of parsers fails
     */
    function test_ap_3ary_03(test_ap: AppFunctionType) {  
        const operation = (s1: string) => (s2: string) => (s3: string) => display_three(s1, s2, s3)  
        const test_input = "  aaa bbbb ccccc2ring"
        const result = test_ap(test_ap(test_ap(APP.pure(operation), numeric), alphas), alphas)(test_input)
        assert(Maybe.isNothing(result), "test_ap_3ary_02 should fail")
        console.log(`test_ap_3ary_03 done`)
    }
    function test_ap_nary(test_ap: AppFunctionType) {
        test_ap_2ary_01(test_ap)
        test_ap_2ary_02(test_ap)
        test_ap_2ary_03(test_ap)
        test_ap_3ary_01(test_ap)
        test_ap_3ary_02(test_ap)
        test_ap_3ary_03(test_ap)
    }
    console.log("test_ap about to start")
    // test_ap_impls()
    test_ap_nary(APP.ap_impl_naive)
    test_ap_nary(APP.ap_impl_monad)
    test_ap_nary(APP.ap_impl_liftA2)

}
export function test() {
    test_ap_implementations()
}
if (typeof require !== 'undefined' && require.main === module) {
    test();
}
