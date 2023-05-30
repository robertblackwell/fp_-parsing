import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import * as SP from "../src/string_primitives"
import * as ST from "../simple_test/simple_test"
import {display_one, display_two, display_three} from "../tests/test_helpers"
const alphas = SP.alphas
const numeric =  SP.numeric
/**
 * There are 3 different implementations of the function App.liftA2 for the parser monad
 * 
 * liftA2_impl_naive - this implementation is specific to the Parser Monad and uses internal knowledge of that monad. It was the first one implemented
 * 
 * liftA2_impl_monad - derives the `liftA2` function from the `bind` function of a monad and is NOT specific to the parser monad
 * 
 * liftA2_impl_ap    - derives the `liftA2` function from an implementation of the same functors `ap` or `<*>` function. 
 * Which implementation of `ap` is used ? The naive or Parser specific implementation.
 * 
 * The purpose of this set of tests to to demonstrate that all implementations of `liftA2` are the same
 */
type P<T> = PT.ParserType<T>
type LiftA2Type = <A, B, C>(f: (a: A, b: B) => C) => (x: P<A>, y: P<B>) => P<C>


function define_liftA2_tests(test_liftA2: LiftA2Type) {
    // const ttwo = pure(Kurry2(two))
    // const ff = ap<string, (s: string)=>string>(ttwo, alpha)
    ST.register("test_liftA_01", () => {
        /**
         * parse two consecutive alpha strings
         */
        const test_input = "  this isast 2ring"
        const result: PR.PResult<string> = test_liftA2(display_two)(alphas, alphas)(test_input)
        ST.assert(! Maybe.isNothing(result), "test liftA2 did not fail")
        ST.assert(Maybe.get_value(result).value == "this + isast", "liftA2 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " 2ring", "liftA2 test remaining input")
        // console.log(result)
//        console.log("test_liftA2_01 done")
    })
    ST.register("test_liftA_02", () => {
        /**
         * parse an alpha followed by a numeric strings
         */
        const test_input = "  this 2345 isast 2ring"
        const result: PR.PResult<string> = test_liftA2(display_two)(alphas, numeric)(test_input)
        ST.assert(! Maybe.isNothing(result), "test liftA2 02 did not fail")
        ST.assert(Maybe.get_value(result).value == "this + 2345", "liftA2 02 test value")
        ST.assert(Maybe.get_value(result).remaining_input == " isast 2ring", "liftA2 02 test remaining input")
        // console.log(result)
//        console.log("test_liftA2_02 done")
    })
    ST.register("test_liftA_03", () => {
        /**
         * parse an alpha followed by a numeric strings but fail as no numeric
         */
        const test_input = "  this isast 2ring"
        const result: PR.PResult<string> = test_liftA2(display_two)(alphas, numeric)(test_input)
        ST.assert(Maybe.isNothing(result), "test liftA2 03 should fail")
//        console.log("test_liftA2_03 done")
    })
}
define_liftA2_tests(APP.liftA2_impl_naive)
define_liftA2_tests(APP.liftA2_impl_ap)
define_liftA2_tests(APP.liftA2_impl_monad)

if (typeof require !== 'undefined' && require.main === module) {
    ST.run()
}