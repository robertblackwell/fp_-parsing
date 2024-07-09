//@file_start  ast_intro.md
//@markdown_start
/*
# Abstract Syntax Tree

The goal is to parse an arithmetic expression and produce a structire called an `Abstract Syntax Tree`. 

Ideally we would define the tree in a manner that parallels the BNF definition of an expression. In Haskell Something like:

```haskell

data TreeNode a = 
    PlusNode TreeNode TreeNode
    | MultNode TreeNode TreeNode
    | BracketNode TreeNode
    | NumberNode  string
```

In Typescript something like the code below is the best we can do.

```ts 
    abstract class TreeNode {....}
    class PlusNode extends TreeNode  {left: TreeNode; right: TreeNode}
    class MultNode extends TreeNode  {left: TreeNode; right: TreeNode}
    class BracketNode  extends TreeNode  {inside: TreeNode}
    class NumberNode extends TreeNode {value: number}
```
However we are going to provide an implementation that follows the spirit of the above code but puts in place 
features that are aimed at ensuring that we cannot build an invalid binary tree. 

In particular our implementation
will hide the class constructor and provide the following constructors function.

```ts 
    PlusNode.make(left: TreeNode, right: TreeNode)
    MultNode.make(left: TreeNode, right: TreeNode)
    BracketNode.make(child: TreeNode)
    NumberNode.make(n: number)
```

each of these `make` functions return a `frozen` object to ensure immutability.

When manipulating TreeNodes one often needs to know the concrete type of a `TreeNode`. To facilitate this
there are a set of free functions with names like `isMultNode(node: TreeNode): boolean`
which can be used in an if-ifelse-else chain. Once having determined the concrete type
of a `TreeNode` such a node needs to be "cast" to the appropriate concrete type. There are 
a suite of functions to do this, with error checking. Names like `asMultNode(node: TreeNode): MultNode`.

The above arrangement provides an equivalent to the Haskell `data` statement provided earlier. However
because of the `type casting` type safety depends on hand coded runtime checking.  

Unfortunately this is as close as I can get in Typescript to Haskells pattern matching. 

## Defining Ast

Below we define the machinery for a binary tree representatiin of an arithmetic expression.

## Node Types

Each tree node type is a subclass of `TreeNode`. TreeNode and subtypes are immutable
and their construction can only be performed by the `make()` static method to ensure
all instance of `TreeNode` are legitimate.
*/
//@markdown_end
//@code_start
type TreeNodeType = "number" | "bracket" | "add" | "mult" | "char" | "plussign" | "multsign"


export abstract class TreeNode {
    node_type: TreeNodeType
    protected constructor(t: TreeNodeType) {
        this.node_type = t
    }
    public static isNumberNode(n: TreeNode): boolean {
        return (n instanceof(NumberNode))
    }
    
    public static asNumberNode(n: TreeNode) : NumberNode {
        if(!(n.node_type == "number")) {
            throw new Error(`asNumberNode node_type is ${n.node_type}`)
        }
        return (n as unknown) as NumberNode
    }
    
}
export class NumberNode extends TreeNode {
    private value: number
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
        return Object.freeze(new MultSignNode())
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
//@code_end
//@markdown_start
/*
## Detecting the type of a Tree node (poor mans pattern matching)
*/
//@markdown_end
//@code_start
export const expression_comment = "this is an export value"

export function isNumberNode(n: TreeNode): boolean {
    return (n instanceof(NumberNode))
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
//@code_end
//@markdown_start
/*
## Casting a tree node base class instance to a specific node type
*/
//@markdown_end
//@code_start
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
//@code_end
//@file_end
//@file_start tree_walker.md
//@markdown_start
/*
*/
//@markdown_end
//@code_start
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
//@code_end
//@markdown_start
/*
The above two functions walk a tree recursively, they look pretty much
the same except for the resulting value.

For these functions to work the "value" is required to support 4 operations:

-    create a value from a number
-    bracket a value
-    combine two values with a "+"
-    combine two values with a *
So lets define an interface that implements those operations
and see if we can generalize the above two functons
*/
//@markdown_end
//@code_start
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
//@code_end
//@file_end