
type TreeNodeType = "number" | "bracket" | "add" | "mult"
export abstract class TreeNode {
    node_type: TreeNodeType
    constructor(t: TreeNodeType) {
        this.node_type = t
    }
}
export class NumberNode extends TreeNode {
    value: number
    constructor(v: number) {
        super("number")
        this.value = v
    }
    static make(v: number): NumberNode {
        return new NumberNode(v)
    }
}
export class BracketNode extends TreeNode {
    child: TreeNode
    constructor(c: TreeNode) {
        super("bracket")
        this.child = c
    }
    static make(c: TreeNode): BracketNode {
        return new BracketNode(c)
    }
}
export class AddNode extends TreeNode {
    left: TreeNode;
    right: TreeNode
    constructor(left: TreeNode, right: TreeNode) {
        super("add")
        this.left = left
        this.right = right
    }
    static make(left: TreeNode, right: TreeNode): AddNode {
        return new AddNode(left, right)
    }
}
export class MultNode extends TreeNode {
    left: TreeNode;
    right: TreeNode
    constructor(left: TreeNode, right: TreeNode) {
        super("mult")
        this.left = left
        this.right = right
    }
    static make(left: TreeNode, right: TreeNode): MultNode {
        return new MultNode(left, right)
    }
}

export const expression_comment = "this is an export value"

export function isNumberNode(n: TreeNode): boolean {
    return (n instanceof(NumberNode))
    return ("value" in n)
}
export function isBracketNode(n: TreeNode): boolean {
    return (n instanceof(BracketNode))
    return ("child" in n)
}
export function isAddNode(n: TreeNode): boolean {
    return (n instanceof(AddNode))
    return ("left" in n) && (n.node_type == "add")
}
export function isMultNode(n: TreeNode): boolean {
    return (n instanceof(MultNode))
    return ("left" in n) && (n.node_type == "mult")
}

export function asNumberNode(n: TreeNode) : NumberNode {
    if(!(n.node_type == "number")) {
        throw new Error(`asNumberNode node_type is ${n.node_type}`)
    }
    return (n as unknown) as NumberNode
}
export function asBracketNode(n: TreeNode) : BracketNode {
    if(!(n.node_type == "bracket")){
        throw new Error(`asBracketNode node_type is ${n.node_type}`)
    }
    return ((n as unknown) as BracketNode)
}
export function asAddNode(n: TreeNode) : AddNode {
    if(!(n.node_type == "add")){
        throw new Error(`asAddNode node_type is ${n.node_type}`)
    }
    return n as AddNode
}
export function asMultNode(n: TreeNode) : MultNode {
    if(!(n.node_type == "mult")){
        throw new Error(`asMultNode node_type is ${n.node_type}`)
    }
    return n as MultNode
}

function mk_number_node(n: number): TreeNode {
    return NumberNode.make(n) as TreeNode
}
function mk_bracket_node(exp: TreeNode): TreeNode {
    return BracketNode.make(exp) as TreeNode
}
function mk_add_node(exp1: TreeNode, exp2: TreeNode): TreeNode {
    return AddNode.make(exp1, exp2) as TreeNode
}
function mk_mult_node(exp1: TreeNode, exp2: TreeNode): TreeNode {
    return AddNode.make(exp1, exp2) as TreeNode
}

function node_tostring(n: TreeNode): string {
    if(isNumberNode(n)) {
        let nNode = asNumberNode(n)
        return `${nNode.value}`
    } else if(isBracketNode(n)) {
        const bNode: BracketNode = asBracketNode(n)
        const childstr = node_tostring(bNode.child)
        return `(${childstr})`
    } else if(isAddNode(n)) {
        let aNode = asAddNode(n)
        let left = node_tostring(aNode.left)
        let right = node_tostring(aNode.right)
        return `${left} + ${right}` 
    } else if(isMultNode(n)) {
        let mNode = asMultNode(n)
        let left = node_tostring(mNode.left)
        let right = node_tostring(mNode.right)
        return `${left} * ${right}` 
    } else {
        throw new Error(`walk if chain failed n.node_type = ${n.node_type}`)
    }
    return ""
}
function evaluate_tree(n: TreeNode): number {
    if(isNumberNode(n)) {
        let nNode = asNumberNode(n)
        return nNode.value
    } else if(isBracketNode(n)) {
        const bNode: BracketNode = asBracketNode(n)
        const childval = evaluate_tree(bNode.child)
        return childval
    } else if(isAddNode(n)) {
        let aNode = asAddNode(n)
        let left = evaluate_tree(aNode.left)
        let right = evaluate_tree(aNode.right)
        return left + right 
    } else if(isMultNode(n)) {
        let mNode = asMultNode(n)
        let left = evaluate_tree(mNode.left)
        let right = evaluate_tree(mNode.right)
        return left * right 
    } else {
        throw new Error(`walk if chain failed n.node_type = ${n.node_type}`)
    }
    return 0
}
interface TreeValue {
    evalNumber(num: NumberNode): TreeValue,
    bracket(n: TreeValue): TreeValue, 
    add(a: TreeValue): TreeValue,
    mult(a: TreeValue): TreeValue
}
interface TreeWalker {
    make(n: number): TreeValue,
    add(a: TreeValue, b: TreeValue): TreeValue,
    mult(a: TreeValue, b: TreeValue): TreeValue
}
function treeWalker(n: TreeNode, walker: TreeWalker): TreeValue {
    function recursive_walker(n: TreeNode): TreeValue {
        if(isNumberNode(n)) {
            let nNode = asNumberNode(n)
            return walker.make(nNode.value)
        } else if(isBracketNode(n)) {
            const bNode: BracketNode = asBracketNode(n)
            return recursive_walker(bNode.child)
        } else if(isAddNode(n)) {
            let aNode = asAddNode(n)
            let left = recursive_walker(aNode.left)
            let right = recursive_walker(aNode.right)
            return left.add(right) 
        } else if(isMultNode(n)) {
            let mNode = asMultNode(n)
            let left = recursive_walker(mNode.left)
            let right = recursive_walker(mNode.right)
            return left.mult(right) 
        } else {
            throw new Error(`walk if chain failed n.node_type = ${n.node_type}`)
        }
    }
    return recursive_walker(n)
}
