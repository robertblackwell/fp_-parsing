'use strict'
import {MultNode, AddNode, BracketNode, NumberNode} from "../src/zjunk/tree/tree"
import {node_tostring, evaluate_tree, treeAsString, treeAsNumber} from "../src/zjunk/tree/walker"
import * as P from "./parser"

function test_tree() {
    const t = 
    MultNode.make(
        NumberNode.make(4),
        BracketNode.make(
                    AddNode.make(
                        NumberNode.make(3), 
                        NumberNode.make(5)
                    )
        )
    )
    console.log(`symbolically ${node_tostring(t)} evaluated : ${evaluate_tree(t)}`)
    const t2 = 
        AddNode.make(
            NumberNode.make(3),
            MultNode.make(
                NumberNode.make(4),
                NumberNode.make(5)
            )
        )
        console.log(`symbolically ${node_tostring(t2)} evaluated : ${evaluate_tree(t2)}`)

    console.log(`new symbolically ${treeAsString(t)} number ${treeAsNumber(t)}` )
    console.log(`new symbolically ${treeAsString(t2)} number ${treeAsNumber(t2)}` )
}
function main() {
    test_tree()
    P.test_parser()
}
main();
