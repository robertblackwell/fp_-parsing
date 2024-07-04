
type TreeNodeType = "number" | "bracket" | "add" | "mult" | "char" | "plussign" | "multsign"


export abstract class TreeNode {
    node_type: TreeNodeType
    protected constructor(t: TreeNodeType) {
        this.node_type = t
    }
}
export class NumberNode extends TreeNode {
    value: number
    private constructor(v: number) {
        super("number")
        this.value = v
    }
    static make(v: number): NumberNode {
        return new NumberNode(v)
    }
}
export class CharNode extends TreeNode {
    ch: string
    private constructor(ch: string) {
        if(ch.length != 1) {
            throw new Error(`CharNode.constructor ch is too long ${ch}`)
        }
        super("char")
        this.ch = ch
    }
    static make(ch: string): CharNode {
        return new CharNode(ch)
    }
}

export class PlusSignNode extends TreeNode {
    ch: string
    private constructor() {
        super("plussign")
        this.ch = "+"
    }
    static make(): PlusSignNode {
        return new PlusSignNode()
    }
}
export class MultSignNode extends TreeNode {
    ch: string
    private constructor() {
        super("multsign")
        this.ch = "*"
    }
    static make(): MultSignNode {
        return new MultSignNode()
    }
}

export class BracketNode extends TreeNode {
    child: TreeNode
    private constructor(c: TreeNode) {
        super("bracket")
        this.child = c
    }
    static make(c: TreeNode): BracketNode {
        return new BracketNode(c)
    }
}
export class AddNode extends TreeNode {
    left:  TreeNode
    right: TreeNode
    op:    PlusSignNode
    private constructor(left: TreeNode, right: TreeNode) {
        super("add")
        this.left = left
        this.right = right
        this.op = PlusSignNode.make() 
    }
    static make(left: TreeNode, right: TreeNode): AddNode {
        return new AddNode(left, right)
    }
}
export class MultNode extends TreeNode {
    left: TreeNode
    right: TreeNode
    op: MultSignNode
    private constructor(left: TreeNode, right: TreeNode) {
        super("mult")
        this.left = left
        this.right = right
        this.op = MultSignNode.make()
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
}
export function isAddNode(n: TreeNode): boolean {
    return (n instanceof(AddNode))
}
export function isMultNode(n: TreeNode): boolean {
    return (n instanceof(MultNode))
}
export function isPlusSignNode(n: TreeNode): boolean {
    return (n instanceof(PlusSignNode))
}
export function isMultSignNode(n: TreeNode): boolean {
    return (n instanceof(MultSignNode))
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
export function asPlusSignNode(n: TreeNode) : PlusSignNode {
    if(!(n.node_type == "plussign")){
        throw new Error(`asPlusSignNode node_type is ${n.node_type}`)
    }
    return n as PlusSignNode
}
export function asMultSignNode(n: TreeNode) : MultSignNode {
    if(!(n.node_type == "multsign")){
        throw new Error(`asMultSignNode node_type is ${n.node_type}`)
    }
    return n as MultSignNode
}
