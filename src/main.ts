'use strict'
import {MultNode, AddNode, BracketNode, NumberNode} from "./tree"
import {node_tostring, evaluate_tree} from "./walker"

function main() {
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
    }

main();
