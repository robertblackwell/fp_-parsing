import * as TSP01 from "../src/string_primitives_01"
import * as TSP from "../src/string_primitives"
import * as Maybe from "../src/maybe"
import * as ST from "../simple_test/simple_test"


ST.register("String primitive tests 1", function() {
    ST.assert(true, "")
    // console.log(`test_parse_sum 01`)
})
ST.register("String primitive tests 2", function() {
    ST.assert(true, "")
    // console.log(`test_parse_sum 02`)
})
if (typeof require !== 'undefined' && require.main === module) {
    ST.run()
}
