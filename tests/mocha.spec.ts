// tests/calculator.spec.tx
import { assert } from "chai";

function addition(a: number, b: number) {
    return a + b
}

describe("Calculator Tests", () => {
    it("should return 5 when 2 is added to 3", () => {
        const result = addition(2, 3);
        assert.equal(result, 5);
    });
    
});