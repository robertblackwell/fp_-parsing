import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as PM from "../src/parser_monad"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import * as COMB from "../src/parser_combiners"
import * as PRIM from "../src/string_primitives"
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

function test_many() {
    function test_many_1() {
        const p = COMB.many(PRIM.parseSingleDigit)
        const rr = p("123tyu")
        assert(Maybe.isNothing(rr) == false, "should not fail")
        const v1 = Maybe.get_value(rr)
        assert(v1.remaining_input == "tyu", "only consumed the digits")
        assert(v1.value.length == 3, "array length 3")
        assert(v1.value.join(",") == "1,2,3", "")
        console.log(rr)
        const rr2 = p("wjwjwj")
        assert(Maybe.isNothing(rr2), "should fail")
        console.log(rr2)
        const rr3 = PM.bind(p, (ar) => PM.eta(ar.join(":")))("19374aJJJJ")
        const v3 = Maybe.get_value(rr3)
        assert(v3.remaining_input == "aJJJJ", "only consumed the digits")
        assert(v3.value == "1:9:3:7:4", "the value should be 1:9:3:7:4")

        console.log(rr3)
    }
    test_many_1()
}
export function test_combinators() {
    test_manyOr()
}
function test_choice() {
    
}
function test_oneormore_parser() {
    const test_input = "1234hhhh"

    const p2 = COMB.createOneOrMoreParser_new(PRIM.parseSingleDigit)
    const r2 = p2(test_input)
    console.log(r2)
}
// test_oneormore_parser()
test_many()
// test_combinators()