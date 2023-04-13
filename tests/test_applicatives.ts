import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import {assert, display_one, display_two, display_three} from "./test_helpers"
// short hands for APP.P which is a short hand for PT.ParserType
type P<T> = APP.P<T>
/*************************************************************
 * Tests
 *************************************************************/
function tests_mu() {
    function p1(s:string): PR.PResult<string> {
        return PP.make(s.substring(0,1), s.substring(1))
    }
    //
    // create an element of P<P<string>
    //
    function ppelement(sinput: string): PR.PResult<P<string>> {
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
    const x = APP.mu<string>(ppelement)
    console.log("mu test done")
}
function test_apply() {
    /**
     * First some parsers to use in the `ap` tests. 
     * Will have 2 of them 
     * -    `alphas` - collect alphabetic caracters
     * -    `numeric` - collects digits
     * 
     * whitespace() is just so we can put a break between tokens
     */
    function whitespace(sinput: string): string {
        let s= sinput.slice(0)
        while((s.length > 0)&&(s.substring(0,1) == " ")) {
            s = s.slice(1)
        }
        return s
    }
    function make_parser_regex(regex: RegExp): P<string> {
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
    const alphas = make_parser_regex(/[A-Za-z]/g)
    const numeric = make_parser_regex(/[0-9]/g)

    function test_stuff() {
        // const x = liftA2<string, string, string>(display_strings)(alpha, alpha)
        const one = APP.pure(display_one)
        const two = APP.pure(display_two)
        const f = APP.ap<string, string>(one, alphas)
        const y = f("thisisastring")
        console.log(y)
    }
    function test_lift()
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
    function test_do() {
        function div(a: number, b: number): Maybe.Maybe<number> {
            if( b > -0.1 && b < 0.1) 
                return Maybe.nothing()
            return Maybe.just(a / b)
        }
        function sum(a: number, b: number): number {
            return a + b
        } 
        /*
        * whenever one sees an unpacking of a Maybe<T> value to apply a fuunction to it
        * should think of using Maybe.bind. And in Haskell think "do {}"
        */
        function do_without_bind() {
            function combine(ma: Maybe.Maybe<number>, mb: Maybe.Maybe<number>): Maybe.Maybe<number> {
                if(Maybe.isNothing(mb)) {
                    return Maybe.nothing()
                } 
                if(Maybe.isNothing(mb)) {
                    return Maybe.nothing()
                }
                return div(Maybe.get_value(ma), Maybe.get_value(mb))
            }
            const ma = div(12, 2)
            const mb = div(12, 4)
            const mc = combine(ma, mb)
            assert(!Maybe.isNothing(mc), "do _without_bind_demo ! isNothing()")
            assert(Maybe.get_value(mc) == 2, "do _without_bind_demo assert value is 2")
            console.log(`do _without_bind_demo result is ${mc}`)

        }
        
        function test_do_01() {
            const ma = div(12, 2)
            const mb = div(12, 4)
            const mc = Maybe.bind(ma, (a) => Maybe.bind(mb, (b) => div(a,b)))
            assert(!Maybe.isNothing(mc), "test_do_01 assert ! isNothing()")
            assert(Maybe.get_value(mc) == 2, "test_do_01 assert value is 2")
            console.log(`test_do_01 result is ${mc}`)
        }
        function test_do_02() {
            const ma = div(6, 2)
            const mb = div(12, 4)
            const mc = Maybe.bind(ma, (a) => Maybe.bind(mb, (b) => Maybe.just(sum(a,b))))
            assert(!Maybe.isNothing(mc), "test_do_02 assert ! isNothing()")
            assert(Maybe.get_value(mc) == 6, "test_do_02 assert value is 6")
            console.log(`test_do_02 result is ${mc}`)
        }
        function test_do_03() {
            const ma = div(3, 0)
            const mb = div(12, 4)
            const mc = Maybe.bind(ma, (a) => Maybe.bind(mb, (b) => div(a,b)))
            assert(Maybe.isNothing(mc), "test_do_03 assert  isNothing() as expected")
            console.log(`test_do_03 result is ${mc}`)
        }
        do_without_bind()
        test_do_01()
        test_do_02()
        test_do_03()
    }
    test_do()
    test_lift()
    test_ap()
}

test_apply()
