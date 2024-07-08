import * as Tree from "./tree"


export function node_tostring(n: Tree.TreeNode): string {
    if(Tree.isNumberNode(n)) {
        let nNode = Tree.asNumberNode(n)
        return `${nNode.value}`
    } else if(Tree.isBracketNode(n)) {
        const bNode: Tree.BracketNode = Tree.asBracketNode(n)
        const childstr = node_tostring(bNode.child)
        return `(${childstr})`
    } else if(Tree.isAddNode(n)) {
        let aNode = Tree.asAddNode(n)
        let left = node_tostring(aNode.left)
        let right = node_tostring(aNode.right)
        return `${left} + ${right}` 
    } else if(Tree.isMultNode(n)) {
        let mNode = Tree.asMultNode(n)
        let left = node_tostring(mNode.left)
        let right = node_tostring(mNode.right)
        return `${left} * ${right}` 
    } else {
        throw new Error(`walk if chain failed n.node_type = ${n.node_type}`)
    }
    return ""
}
export function evaluate_tree(n: Tree.TreeNode): number {
    if(Tree.isNumberNode(n)) {
        let nNode = Tree.asNumberNode(n)
        return nNode.value
    } else if(Tree.isBracketNode(n)) {
        const bNode: Tree.BracketNode = Tree.asBracketNode(n)
        const childval = evaluate_tree(bNode.child)
        return childval
    } else if(Tree.isAddNode(n)) {
        let aNode = Tree.asAddNode(n)
        let left = evaluate_tree(aNode.left)
        let right = evaluate_tree(aNode.right)
        return left + right 
    } else if(Tree.isMultNode(n)) {
        let mNode = Tree.asMultNode(n)
        let left = evaluate_tree(mNode.left)
        let right = evaluate_tree(mNode.right)
        return left * right 
    } else {
        throw new Error(`walk if chain failed n.node_type = ${n.node_type}`)
    }
}
/**
 * The above two functions walk a tree recursively, they look pretty much
 * the same except for the resulting value.
 * 
 * For these functions to work the "value" is required to support 4 operations:
 * 
 * -    create a value from a number
 * -    bracket a value
 * -    combine two values with a "+"
 * -    combine two values with a *
 *
 * So lets define an interface that implements those operations
 * and see if we can generalize the above two functons
*/

interface TreeValeOperations<TreeValue> {
    make(n: number): TreeValue,
    bracket(a: TreeValue): TreeValue,
    add(a: TreeValue, b: TreeValue): TreeValue,
    mult(a: TreeValue, b: TreeValue): TreeValue
}



function treeWalker<TreeValue>(n: Tree.TreeNode, value_ops: TreeValeOperations<TreeValue>): TreeValue 
{
    function recursive_walker(n: Tree.TreeNode): TreeValue {
        if(Tree.isNumberNode(n)) {
            let nNode = Tree.asNumberNode(n)
            return value_ops.make(nNode.value)
        } else if(Tree.isBracketNode(n)) {
            const bNode: Tree.BracketNode = Tree.asBracketNode(n)
            let child = recursive_walker(bNode.child)
            return value_ops.bracket(child)
        } else if(Tree.isAddNode(n)) {
            let aNode = Tree.asAddNode(n)
            let left = recursive_walker(aNode.left)
            let right = recursive_walker(aNode.right)
            return value_ops.add(left, right) 
        } else if(Tree.isMultNode(n)) {
            let mNode = Tree.asMultNode(n)
            let left = recursive_walker(mNode.left)
            let right = recursive_walker(mNode.right)
            return value_ops.mult(left, right) 
        } else {
            throw new Error(`walk if chain failed n.node_type = ${n.node_type}`)
        }
    }
    return recursive_walker(n)
}
type TreePrintValue = string

class TreePrintValueOperations {
    make(n: number): TreePrintValue {
        return `${n}`
    }
    bracket(value: TreePrintValue): TreePrintValue {
        return `(${value})`
    }
    add(a: TreePrintValue, b: TreePrintValue): TreePrintValue {
        return `${a} + ${b}`
    }
    mult(a: TreePrintValue, b: TreePrintValue): TreePrintValue {
        return `${a} * ${b}`
    }
}

class TreeNumberValueOperations {
    make(n: number): number {
        return n
    }
    bracket(value: number): number {
        return value
    }
    add(a: number, b: number): number {
        return a + b
    }
    mult(a: number, b: number): number {
        return a * b
    }

}


export function treeAsString(n: Tree.TreeNode): TreePrintValue {
    const ops = new TreePrintValueOperations()
    return treeWalker<TreePrintValue>(n, ops )
}

export function treeAsNumber(n: Tree.TreeNode): number {
    const ops = new TreeNumberValueOperations()
    return treeWalker<number>(n, ops )
}
