import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import {assert, display_one, display_two, display_three, alphas, numeric} from "./test_helpers"
export function test_lift()
{
    // const ttwo = pure(Kurry2(two))
    // const ff = ap<string, (s: string)=>string>(ttwo, alpha)
    function test_liftA_01() {
        /**
         * parse two consecutive alpha strings
         */
        const test_input = "  this isast 2ring"
        const result: PR.PResult<string> = APP.liftA2(display_two)(alphas, alphas)(test_input)
        assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
        assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
        // console.log(result)
        console.log("test_liftA2_01 done")
    }
    function test_liftA_02() {
        /**
         * parse an alpha followed by a numeric strings
         */
        const test_input = "  this 2345 isast 2ring"
        const result: PR.PResult<string> = APP.liftA2(display_two)(alphas, numeric)(test_input)
        assert(! Maybe.isNothing(result), "test liftA2 02 did not fail")
        assert(Maybe.get_value(result).value == "this + 2345", "liftA2 02 test value")
        assert(Maybe.get_value(result).remaining_input == " isast 2ring", "liftA2 02 test remaining input")
        // console.log(result)
        console.log("test_liftA2_02 done")
    }
    function test_liftA_03() {
        /**
         * parse an alpha followed by a numeric strings but fail as no numeric
         */
        const test_input = "  this isast 2ring"
        const result: PR.PResult<string> = APP.liftA2(display_two)(alphas, numeric)(test_input)
        assert(Maybe.isNothing(result), "test liftA2 03 should fail")
        console.log("test_liftA2_03 done")
    }
    test_liftA_01()
    test_liftA_02()
    test_liftA_03()
}
// test_lift()