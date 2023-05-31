import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
type P<T> = PT.P<T>
import * as Maybe from "../src/maybe"
import * as M from "../src/parser_monad"
import * as SP from "../src/final/primitives"
import * as ST from "../simple_test/simple_test"
import {display_one, display_two, display_three} from "../tests/test_helpers"
const alphas = SP.alphas
const numeric = SP.numeric

function tests_mu() {
    function p1(s:string): PR.PResult<string> {
        return PP.make(s.substring(0,1), s.substring(1))
    }
    //
    // create an element of P<P<string>
    //
    function pp_element(sinput: string): PR.PResult<P<string>> {
        const f: P<string> = (s: string) => {
            if(sinput.substring(0,1) == s.substring(0,1)) {
                return Maybe.just(PP.make(sinput.substring(0,1), sinput.substring(1))) as PR.PResult<string>
            } else {
                return Maybe.nothing()
            }
        }
        const r = Maybe.just(PP.make(f, sinput.slice(0))) 
        return r
    }
    const x = M.mu<string>(pp_element)
    //console.log("mu test done")
}
export function test_mu_monad() {
    tests_mu()
}

type BindFunctionType = <A,B>(pa: P<A>, f:(a:A) => P<B>) => P<B>
type LiftM2FunctionType = <A,B,C>(pa: P<A>, pb: P<B>, f:(a:A, b:B) => C) => P<C>  
type LiftM3FunctionType = <A,B,C,D>(pa: P<A>, pb: P<B>, pc: P<C>, f:(a:A, b:B, c:C) => D) => P<D>  
/**
 * Now demonstrate how to use the monad `bind` function to apply 2 or more parsers i sequence
 */
/**
 * Tests the different implementations of the App.ap function.
 * And demonstrate that the App.ap function is the mechanism by which parsers can be applied
 * in sequence and a function applied to the results of each parser
 */
// function define_monad_test_liftm2() {
    /**
     * Apply a alphanmeric parse twice in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings 
     */
    ST.register("test_monad_2ary_01", () => {
        const test_input = "  this isast 2ring"
        const result = M.liftM2(alphas, alphas, display_two)(test_input)
        ST.assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        const v = Maybe.get_value(result)
        ST.assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
        //console.log(`test_ap_2ary_01 done`)
    })

    /**
     * Apply a alphanmeric parse and a numeric string parser in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings.
     * Note the second string is purely numeric 
     */
    ST.register("test_monad_2ary_02", () => {
        const test_input = "  this 2345 isast 2ring"
        const result = M.liftM2(alphas, numeric, display_two)(test_input)
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
    ST.register("test_monad_2ary_03", () => {
        const test_input = "  this isast 2ring"
        const result = M.liftM2(alphas, numeric, display_two)(test_input)
        ST.assert(Maybe.isNothing(result), "test liftA2 03 should fail")
        //console.log(`test_ap_2ary_03 done`)
    })
// }
// function define_test_monad_liftm3(test_liftM3: LiftM3FunctionType) {
    /**
     * Demonstrate applying the alphanumeric parser three times in sequence.
     */
    ST.register("test_monad_3ary_01", () => {
        const test_input =   "this isast third 2ring"
        const result = M.liftM3(alphas, alphas, alphas, display_three)(test_input)
        ST.assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
        ST.assert(Maybe.get_value(result).value == "display_three this + isast + third", "test_ap_3ary_01 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
        //console.log(`test_ap_3ary_02 done`)
    })    
    /**
     * Same as previous test except this time we apply a function to the three outcomees that does more than
     * print the results of each application. We print only the first and third outcomes
     */
    ST.register("test_monad_3ary_02", () => {
        const test_input =   "this isast third 2ring"
        const operation = (s1: string, s2: string, s3: string) => display_two(s1, s3)
        const result = M.liftM3(alphas, alphas, alphas, operation)(test_input)
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
    ST.register("test_monad_3ary_03", () => {  
        const operation = (s1: string) => (s2: string) => (s3: string) => display_three(s1, s2, s3)  
        const test_input = "  aaa bbbb ccccc2ring"
        const result = M.liftM3(numeric, alphas, alphas, display_three)(test_input)
        // const result = test_ap(test_ap(test_ap(APP.pure(operation), numeric), alphas), alphas)(test_input)
        ST.assert(Maybe.isNothing(result), "test_ap_3ary_02 should fail")
        //console.log(`test_ap_3ary_03 done`)
    })
// }
if (typeof require !== 'undefined' && require.main === module) {
    ST.run()
}