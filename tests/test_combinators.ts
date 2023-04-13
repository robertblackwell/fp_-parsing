import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import * as COMB from "../src/parser_combiners"
import {assert, P} from "./test_helpers"


function test_manyOr() {
    function parseDigit(sinput: string) {
        let s = sinput.slice(0)
        let result = ""
        if((s.length > 0) && (s.substring(0, 1).match(/[0-9]/g) != null)) {
            result += s.substring(0, 1)
            s = s.slice(1)
        } 
        return (result == "")? Maybe.nothing() : PP.make(result, s)
    }
    function test_combinators_manyOr_01() {
        const r = COMB.manyOr(parseDigit)("123r")
        assert(Maybe.isNothing(r) == false, "test_combinators_manyOr01 is NOT nothing")
        const v = Maybe.get_value(r)
        assert(v.value.length == 3, "test_combinators_manyOr01 length is 3")
        assert(v.remaining_input == "r", "test_combinators_manyOr01 remainder is OK")
        assert(v.value[0] == "1", "test_combinators_manyOr01 [0]")
        assert(v.value[1] == "2", "test_combinators_manyOr01 [1]")
        assert(v.value[2] == "3", "test_combinators_manyOr01 [3]")
        console.log(`test_combinators_manyOr01 done ${v}`)
    }   
    function test_combinators_manyOr_02() {
        //
        // This parse succeeds  and returns an empty array of components. Since
        // zero hits is considered success
        //
        const r = COMB.manyOr(parseDigit)("x123r")
        assert(Maybe.isNothing(r) == false, "test_combinators_manyOr02 is NOT nothing")
        const v = Maybe.get_value(r)
        assert(v.value.length == 0, "test_combinators_manyOr02 length is 0")
        assert(v.remaining_input == "x123r", "test_combinators_manyOr02 remainder is OK")
        console.log(`test_combinators_manyOr02 done ${v}`)
    }   
    function test_combinators_someOr_01() {
        const r = COMB.someOr(parseDigit)("123r")
        assert(Maybe.isNothing(r) == false, "test_combinators_someOr01 is NOT nothing")
        const v = Maybe.get_value(r)
        assert(v.value.length == 3, "test_combinators_someOr01 length is 3")
        assert(v.remaining_input == "r", "test_combinators_someOr01 remainder is OK")
        assert(v.value[0] == "1", "test_combinators_someOr01 [0]")
        assert(v.value[1] == "2", "test_combinators_someOr01 [1]")
        assert(v.value[2] == "3", "test_combinators_someOr01 [3]")
        console.log(`test_combinators_someOr01 done ${v}`)
    }   

    function test_combinators_someOr_02() {
        //
        // This parse succeeds  and returns an empty array of components. Since
        // zero hits is considered success
        //
        const r = COMB.someOr(parseDigit)("x123r")
        assert(Maybe.isNothing(r) == true, "test_combinators_someOr02 should fail")
        console.log(`test_combinators_someOr02 done ${r}`)
    }   
    function test_combinators_oneormore_02() {
        // this is not working
        return
        const r = COMB.createOneOrMoreParser_new(parseDigit)("123r")
        assert(Maybe.isNothing(r) == false, "test_combinators_oneofmore_02 is NOT nothing")
        const v = Maybe.get_value(r)
        assert(v.value.length == 3, "test_combinators_oneofmore_02 length is 3")
        assert(v.remaining_input == "r", "test_combinators_oneofmore_02 remainder is OK")
        assert(v.value[0] == "1", "test_combinators_oneofmore_02 [0]")
        assert(v.value[1] == "2", "test_combinators_oneofmore_02 [1]")
        assert(v.value[2] == "3", "test_combinators_oneofmore_02 [3]")
        console.log(`done ${v}`)
    }   
    function test_sequence2() {

    }
    test_combinators_manyOr_01()
    test_combinators_manyOr_02()
    test_combinators_someOr_01()
    test_combinators_someOr_02()
    test_combinators_oneormore_02()
}
export function test_combinators() {
    test_manyOr()
}
// test_combinators()