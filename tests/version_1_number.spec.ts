// tests/calculator.spec.tx
import { assert } from "chai";
import {describe, it, run} from "mocha"
import {TreeNode, treeAsString} from "../src/tree"
import {isNothing, getValue} from "../src/version_1/maybe_v1"
import {parseNumber, choice} from "../src/version_1/parsing_intro"
import { 
    parseAdditionSign, 
    parseMultiplySign, 
    parseOpenBracket, 
    parseCloseBracket,
    parseNumberExp,
    parseBracketExp,
    expression,
    term, term_only, term_plus_expression_1, term_plus_expression_2,
    factor, factor_only, factor_times_term_1, factor_times_term_2,

    choiceN,
 } from "../src/version_1/expression_parser_version_1";

function addition(a: number, b: number) {
    return a + b
}
const xassert = {
    isTrue: function isTrue(condition: boolean) {
        if(!condition) {
            throw new Error("assert failed")
        }
    }
}
function test(label: string, f:()=>void ) {
    try {
        f()
    } catch(e) {
        console.log(e)
    }
}

test("experiment" , () => {
    xassert.isTrue(false)
})

describe("Calculator Tests", () => {
    it("should return 5 when 2 is added to 3", () => {
        const result = addition(2, 3);
        assert.equal(result, 5);
    });
});

describe("testing number", () => {
    it("string numbers", () => {
        const x = parseNumber("1234 xv")
        assert.isFalse(isNothing(x))
        const {result: s1, remaining: s2} = getValue(x)
        assert.equal(s1, "1234")
        assert.equal(s2, " xv")
    })
    it("string numbers", () => {
        const x = parseNumber("a 1234 xv")
        assert.isTrue(isNothing(x))
    })
})
describe("test mult/add/(/)", () => {
    it("add", () => {
        const x = parseAdditionSign(" + 3")
        assert.isFalse(isNothing(x))
        const {result: s1, remaining: s2} = getValue(x)
        assert.equal(s1, "+")
        assert.equal(s2, " 3")
    })
    it("mul", () => {
        const x = parseMultiplySign(" * 3")
        assert.isFalse(isNothing(x))
        const {result: s1, remaining: s2} = getValue(x)
        assert.equal(s1, "*")
        assert.equal(s2, " 3")
    })
    it("(", () => {
        const x = parseOpenBracket("   (2* 3")
        assert.isFalse(isNothing(x))
        const {result: s1, remaining: s2} = getValue(x)
        assert.equal(s1, "(")
        assert.equal(s2, "2* 3")
    })
    it(")", () => {
        const x = parseCloseBracket(" ) + 2* 3")
        assert.isFalse(isNothing(x))
        const {result: s1, remaining: s2} = getValue(x)
        assert.equal(s1, ")")
        assert.equal(s2, " + 2* 3")
    })
})
describe("test choice", () => {
    it("choiceN", () => {
        const p = choice(parseAdditionSign, parseMultiplySign)
        {
            const x = p("  +123")
            assert.isFalse(isNothing(x))
            const {result:a, remaining: b} = getValue(x)
            assert.equal(a, "+")
            assert.equal(b, "123")
        }
        {
            const x2 = p("  * (123")
            assert.isFalse(isNothing(x2))
            const {result:a, remaining: b} = getValue(x2)
            assert.equal(a, "*")
            assert.equal(b, " (123")
        }
    })
})
describe("expression building blocks", ()=>{
    it("numbers", () => {
        const x = parseNumberExp(" 1234xcd")
        assert.isFalse(isNothing(x))
        const {result:a, remaining:b} = getValue(x)
        assert.equal(b, "xcd")
        assert.isTrue(a instanceof TreeNode)
        const ts = treeAsString(a)
        console.log(ts)
        assert.equal(ts, "1234")
    })
    it("factor ::= numbers", () => {
        const x = factor_only(" 1234xcd")
        assert.isFalse(isNothing(x))
        const {result:a, remaining:b} = getValue(x)
        assert.equal(b, "xcd")
        assert.isTrue(a instanceof TreeNode)
        const ts = treeAsString(a)
        console.log(ts)
        assert.equal(ts, "1234")
    })
    it("( number )", () => {
        const x = parseBracketExp(" ( 1234)xcd")
        assert.isFalse(isNothing(x))
        const {result:a, remaining:b} = getValue(x)
        assert.equal(b, "xcd")
        assert.isTrue(a instanceof TreeNode)
        const ts = treeAsString(a)
        console.log(ts)
        assert.equal(ts, "(1234)")
    })
    it(" 2 + 4  ", () => {
        const x = expression(" 2 + 4  ")
        assert.isFalse(isNothing(x))
        const {result:a, remaining:b} = getValue(x)
        assert.equal(b, "  ")
        assert.isTrue(a instanceof TreeNode)
        const ts = treeAsString(a)
        console.log(ts)
        assert.equal(ts, "2 + 4")
    })
    it(" 2 * 4  ", () => {
        const x = term(" 2 * 4  ")
        assert.isFalse(isNothing(x))
        const {result:a, remaining:b} = getValue(x)
        assert.equal(b, "  ")
        assert.isTrue(a instanceof TreeNode)
        const ts = treeAsString(a)
        console.log(['term of 2 * 4 : ',ts])
        assert.equal(ts, "2 * 4")
    })

})
run()