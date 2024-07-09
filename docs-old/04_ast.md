
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

