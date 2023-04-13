import * as TSP01 from "../src/string_primitives_01"
import * as TSP from "../src/string_primitives"

export function test_string_primitives() {
    TSP01.test_string_primitives()
    TSP.test_parse_sum()
    // this next one does not work
    // TSP.test_createoneormore()
}