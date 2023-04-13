import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"

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
function test_monad() {
    tests_mu()
}
test_monad()