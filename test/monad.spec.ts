import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as M from "../src/parser_monad"
import {P, display_one, display_two, display_three, alphas, numeric} from "../tests/test_helpers"
import { assert } from "chai";
import process from "process"
// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env.TS_NODE_PROJECT = './src/tsconfig.json'

// Optional: set env variable to enable `tsconfig-paths` integration
// process.env.TS_CONFIG_PATHS = true;

// register mocha wrapper
require('ts-mocha');

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
    console.log("mu test done")
}
export function test_mu_monad() {
    tests_mu()
}

/**
 * Now demonstrate how to use the monad `bind` function to apply 2 or more parsers i sequence
 */
/**
 * Tests the different implementations of the App.ap function.
 * And demonstrate that the App.ap function is the mechanism by which parsers can be applied
 * in sequence and a function applied to the results of each parser
 */

describe("Monad tests", () => {
    let test_bind = M.bind
    /**
     * Apply a alphanmeric parse twice in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings 
     */
    it("test_monad_2ary_01", () => {
        const test_input = "  this isast 2ring"
        const result = M.liftM2(alphas, alphas, display_two)(test_input)
        assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        const v = Maybe.get_value(result)
        assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
        assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
        console.log(`test_ap_2ary_01 done`)
    })

    /**
     * Apply a alphanmeric parse and a numeric string parser in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings.
     * Note the second string is purely numeric 
     */
    it("test_monad_2ary_02", () => {
        const test_input = "  this 2345 isast 2ring"
        const result = M.liftM2(alphas, numeric, display_two)(test_input)
        assert.notEqual(Maybe.isNothing(result), true)
        assert.equal(Maybe.get_value(result).value, "this + 2345")
        assert.equal(Maybe.get_value(result).remaining_input, " isast 2ring")
        console.log(`test_ap_2ary_02 done`)
    })
    /**
     * Apply a alphanmeric parse and a numeric string parser in sequence to pull the first two strings off the 
     * front of a string consisting 3 of whitespace separated alpha numeric strings.
     * Note the second string is purely numeric.
     * This parse fails because the second string is not numeric
     */
    it("test_monad_2ary_03", () => {
        const test_input = "  this isast 2ring"
        const result = M.liftM2(alphas, numeric, display_two)(test_input)
        assert.isTrue(Maybe.isNothing(result))
        console.log(`test_ap_2ary_03 done`)
    })
    /**
     * Demonstrate applying the alphanumeric parser three times in sequence.
     */
    it("monad_3ary_01", () => {
        const test_input =   "this isast third 2ring"
        const result = M.liftM3(alphas, alphas, alphas, display_three)(test_input)
        assert.isNotTrue(Maybe.isNothing(result))
        assert.equal(Maybe.get_value(result).value , "display_three this + isast + third")
        assert.equal(Maybe.get_value(result).remaining_input, " 2ring")
        console.log(`test_ap_3ary_02 done`)
    })    
    /**
     * Same as previous test except this time we apply a function to the three outcomees that does more than
     * print the results of each application. We print only the first and third outcomes
     */
    it("test_monad_3ary_02", () => {
        const test_input =   "this isast third 2ring"
        const operation = (s1: string, s2: string, s3: string) => display_two(s1, s3)
        const result = M.liftM3(alphas, alphas, alphas, operation)(test_input)
        assert.isNotTrue(Maybe.isNothing(result))
        assert.equal(Maybe.get_value(result).value, "this + third", "test_ap_3ary_01 test value")
        assert.equal(Maybe.get_value(result).remaining_input, " 2ring")
        console.log(`test_ap_3ary_02 done`)
    })
    /**
     * Apply three parsers in sequence to the input string. The first parser applied only succeeds 
     * if the first string is numeric. Since the first string is not numeric the entire 
     * sequence of parsers fails
     */
    it("test_monad_3ary_03", () => {  
        const operation = (s1: string) => (s2: string) => (s3: string) => display_three(s1, s2, s3)  
        const test_input = "  aaa bbbb ccccc2ring"
        const result = M.liftM3(numeric, alphas, alphas, display_three)
        // const result = test_ap(test_ap(test_ap(APP.pure(operation), numeric), alphas), alphas)(test_input)
        assert.isTrue(Maybe.isNothing(result))
        console.log(`test_ap_3ary_03 done`)
    })
})
