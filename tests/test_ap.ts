import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import {P, assert, display_one, display_two, display_three, alphas, numeric} from "./test_helpers"

function test_stuff() {
    // const x = liftA2<string, string, string>(display_strings)(alpha, alpha)
    const one = APP.pure(display_one)
    const two = APP.pure(display_two)
    const f = APP.ap<string, string>(one, alphas)
    const y = f("thisisastring")
    console.log(y)
}

function test_ap_impls() {
    const test_ap = APP.ap_impl_3
    /**
     * Test the different implimentations of ap
     */
    function test_apimpl_01() {
        // perform liftA2 uwsing `ap` - show each step in excruciating detail
        //
        // Note this is the same as test_lift_01
        //
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
        console.log(`test_apimpl_01 done`)
    }
    test_apimpl_01()
}

function test_ap() {
    const test_ap = APP.ap_impl_3
    /**
     * demonstrate the equivalence of, but differences between `ap` and `liftAn` 
     */
    function test_ap_2ary_01() {
        // perform liftA2 uwsing `ap` - show each step in excruciating detail
        //
        // Note this is the same as test_lift_01
        //
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
    function test_ap_2ary_02() {
        // perform liftA2 uwsing `ap` - this time in more compact form
        //
        // Note this is the same as test_lift_02
        //
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
    function test_ap_2ary_03() {
        // perform liftA2 uwsing `ap` - show each step in excruciating detail
        //
        // Note this is the same as test_lift_01
        //
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
    function test_ap_3ary_01() {
        //
        // demonstrate how to do 3 place operations
        //
        const test_input =   "this isast third 2ring"
        const curried_3ary = (s1:string) => (s2:string) => (s3:string)=>display_three(s1,s2,s3)
        const result = test_ap(test_ap(test_ap(APP.pure(curried_3ary), alphas), alphas), alphas)("  this isast third 2ring")
        assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
        assert(Maybe.get_value(result).value == "display_three this + isast + third", "test_ap_3ary_01 test value")
        assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
        console.log(`test_ap_3ary_02 done`)
    }    
    function test_ap_3ary_02() {
        //
        // demonstrate how to do 3 place operations - but this time leave out the 
        // 2nd parse result. This happens commonly in real situations. For example 
        // when the 2nd token is required to be a fixed string such as "*"
        //
        const test_input =   "this isast third 2ring"
        const operation = (s1: string) => (s2: any) => (s3: string) => display_two(s1, s3)
        const result = test_ap(test_ap(test_ap(APP.pure(operation), alphas), alphas), alphas)("  this isast third 2ring")
        assert(!Maybe.isNothing(result), "test_3ary_01 should not fail")
        assert(Maybe.get_value(result).value == "this + third", "test_ap_3ary_01 test value")
        assert(Maybe.get_value(result).remaining_input == " 2ring", "test_ap_3ary_01 test remaining input")
        console.log(`test_ap_3ary_02 done`)
    }    
    function test_ap_3ary_03() {  
        const operation = (s1: string) => (s2: string) => (s3: string) => display_three(s1, s2, s3)  
        const test_input = "  aaa bbbb ccccc2ring"
        const result = test_ap(test_ap(test_ap(APP.pure(operation), numeric), alphas), alphas)(test_input)
        assert(Maybe.isNothing(result), "test_ap_3ary_02 should fail")
        console.log(`test_ap_3ary_03 done`)
    }
    console.log("test_ap about to start")
    // test_ap_impls()
    test_ap_2ary_01()
    test_ap_2ary_02()
    test_ap_2ary_03()
    test_ap_3ary_01()
    test_ap_3ary_02()
    test_ap_3ary_03()
}
test_ap()
test_ap_impls()