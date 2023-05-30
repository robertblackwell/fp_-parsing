import * as ST from "../simple_test/simple_test"
const spec_modules = [
    "./monad.spec",
    "./liftA2.spec",
    "./ap.spec", 
    "./do.spec", 
    "./combinators.spec",
    "./parser.spec",
    "./string_primitives.spec",    
]
async function loadSpecs(spec_modules: string[]) {
    for await (let mod of spec_modules) {
        await import(mod)
    }
}
async function loadAndRun() {
    await loadSpecs(spec_modules)
    ST.run()
}
loadAndRun()