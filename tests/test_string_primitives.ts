import * as TSP01 from "../src/string_primitives_01"
import * as TSP from "../src/string_primitives"

function test_string_primitives() {
    TSP01.test_string_primitives()
    TSP.test_parse_sum()
    // this next one does not work
    // TSP.test_createoneormore()
}
export function test() {
    test_string_primitives()
}
if (typeof require !== 'undefined' && require.main === module) {
    test();
}
