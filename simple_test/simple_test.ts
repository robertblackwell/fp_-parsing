import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import * as C from "ansi-colors"
type P<T> = APP.P<T>

type UTestFunction = () => void
type Test = {name: string, testfunc: UTestFunction}
type TestResult = null | Error

let utests: Test[] = []
let assert_count = 0
let assert_failed_count = 0
let run_flag = false

function get_stacktrace() {

}

/**
 * Now we need something to test the result
 */
export function assert(condition: boolean, msg: string) {
    assert_count += 1
    const args = arguments
    const oldPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack)  => stack;
    const stack = new Error().stack;
    if (stack !== null && typeof stack === 'object') {
        const position = 1
        // stack[0] holds this file
        // stack[1] holds where this function was called
        // stack[2] holds the file we're interested in
        const site = stack[position]
        if(site !== null && typeof site === 'object') {
            const fn = (site as any).getFileName()
            const func = (site as any).getFunctionName()
            const ln =  (site as any).getLineNumber()
            const ecln = (site as any).getEnclosingLineNumber()
            // console.log(fn, func, ln, ecln)
        }
    }
    if(!condition) {
        console.log(C.red(`assert failed msg: ${msg}`))
        assert_failed_count += 1
        throw new Error(C.red(`assert failed msg: ${msg}`))
    }
}

export function register(name: string, ut: () => void) {
    utests.push({name: name, testfunc: ut})
}
function runone(t: Test): TestResult {
    try {

        t.testfunc()

        return null
    } catch(e) {
        if(e instanceof Error)
            return e
        else
            throw new Error(`test function threw something other than an Error ${e}`)
    }
}
function report() {
    console.log(C.blue('simple_test complete'))
    console.log(C.green(`${utests.length} test functions executed `))
    console.log(C.green(`${assert_count} total asserts `))
    console.log(C.green(`${assert_count - assert_failed_count} asserts passed`))
    if((assert_failed_count > 0)) {
        console.log(C.red(`${assert_failed_count}  asserts failed`))
    }
}
export function run() {
    if(run_flag) {
        throw new Error(`simpletest.run should only be called once - has already been called`)
    }
    run_flag = true
    assert_count = 0
    assert_failed_count = 0
    const testResult = utests.map(runone)
    report()

}