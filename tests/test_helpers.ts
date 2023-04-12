/**
 * Now we need something to test the result
 */
export function assert(condition: boolean, msg: string) {
    if(!condition) {
        console.log(`assert failed msg: ${msg}`)
    }
}
