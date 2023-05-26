## 1.0 `do` notation - what problem does it solve

What problem does the Haskell `do` solve.

Consider you have two functions `f :: X -> M A` and `g :: Y -> M B` which do some
caclulation that prepares input for a final "bring it all together" calculation
represented by a function `k :: (A, B) -> M C`.

As you can see all of these functions produce a `Monadic` result, maybe each calculation 
required some `IO` and `ma` may have failed so `M A` may equal `IO Maybe A`. But for the moment
lets assume that `M = Maybe` (no IO).

How would we apply `k` to the outcomes of `f` and `g`.

In a typical imperative language we would write something like this:

```typescript
function combine(ma: M A, mb: M B, k: (A, B) -> M C)

    if(ma.isNothing() || mb.isNothing()) {
        return Maybe.nothing()
    }
    const a = ma.get_value()
    const b = mb.get_value()
    return k(a, b)
}
```
The problem with the above solution is that it is`Maybe` specific. Is there a way
of doing this for a general `Monad`?

The Haskell solution is

```haskell
combine :: (m a, m b, (a,b) -> m c) -> m c 
combine ma mb k = ma >>= (\x -> 
                  mb >>= (\y -> f x y))    

```
or using `do` notation
```haskell
combine :: (m a, m b, (a,b) -> m c) -> m c 
combine ma mb k =  do {
        x <- ma;
        y <- mb;
        k a b
    }
```

For those like me that find the haskell hard to read the typescript version is

```typescript

function combine(ma: M<A>, mb: M<B>, k: (A, B) -> M<C>): M<C> {
    
    M.bind(ma, (a) => M.bind(mb, (b) => k(a,b)))

}
```

The nested function definitions `(a) => M.bind(mb, (b) => k(a,b))` use scope to make the `a` and `b` available to the inner
call to `k(a, b)`. 

Inline function definitions seem central to this construct.

This is tested and demonstrated in file `tests/test_do.ts`.

It should be noted that the above result can be rephrased as follows:

### Proposition 1:

A function `k: (A, B) -> M C` can be extended to a function `kprime: (M A, M B) -> M C`.

Proof:

The calculation above is the proof.

### Corollary



## 2.0 
A more "categorical" approach

So the above calculations seem to work but for me they are a computer scientists solution not a category theorists solution.

Is there a "higher level" way of achieving the same end that operates at the level of "arrows" rather thannitty-gritty calculations.

The answer of course is __YES__. In fact a little more is possible.

### Proposition 2:

If M is a monad and `p: A x B -> M C` is a function then `p` can be extended to a function `M A x M B -> M C`

An alternate proof:

The following is a sequence of deductions/constructions. Each entry is derived from
the preceeding entry with the justification being given in the second column.  

| Id | Function              | Reason the function can be deduced from the previous function |
|----|-----------------------|---------------------------------------------------------------|
| 1. |   `p: A x B -> M C`   | The given or starting function |
| 2. |   `A -> [B, M C]`     | The closed category isomorphism or currying of  `p` |
| 3. |   `A -> [M B, M C]`   | By applying the Kliesli or Monad extension theorem |
| 4. |   `A x M B -> M C`    | Theclosed category isomorphism or reverse currying |
| 5. |   `M B x A -> M C`    | Commutativity (up to isomorphism) of cartesian product |
| 6. |   `M B -> [A, M C]`   | By currying |
| 7. |   `M B -> [M A, M C]` | By apply the Kliesli or Monad extension theorem |
| 8. |   `M B x M A -> M C`  | By un currying |
| 9. |   `M A x M B -> M C`  | commutativity (up to isomorphism) of cartesian product  |

Now lets take some of these functions and dediuce the formular for them.

Equation 2. `A -> [B, M C]` is defined by `\a -> (\b -> p(a, b))`

Equation 3 `A -> [M B, M C]` is defined by `\a -> Kliesli(\b -> p(a, b))`. Observe that `Kliesli(\b -> p(a, b))` is a function `M B -> M C`

Equation 4. `A x M B -> M C` is defined by `\(a, mb) -> Kliesli(\b -> p(a, b))(mb)` or equivalently `\(a, mb) -> mb >>= (\b -> p(a, b))`  

Equation 6. `M B -> [A, M C]` is defined by `\mb -> \a -> Kliesli(\b -> p(a, b))(mb)` or equivalently `\mb -> (\a -> mb >>= (\b -> p(a, b)) )`

Equation 7. `M B -> [M A, M C]` is defined by `\mb -> Kliesli(\a -> Kliesli(\b -> p(a, b))(mb) )` observe that `Kliesli(\a -> Kliesli(\b -> p(a, b))(mb) )` is a function `M A -> M C` 

Equation 8. `M B x M A -> M C` is defined by `\(mb, ma) -> Kliesli(\a -> Kliesli(\b -> p(a, b))(mb) )(ma)` or equivalently `\(mb, ma) -> ma >>= (\a -> mb >>= (\b -> p(a, b)))`

Finally by reordering the argument `(mb, ma)` to `(ma, mb)` we get:

Equation 9. `MA x M B -> M C` defined as `\(ma, mb) -> Kliesli(\a -> Kliesli(\b -> p(a, b))(mb) )(ma)` or equivalently `\(ma, mb) -> ma >>= (\a -> mb >>= (\b -> p(a, b)))`


### Definition 1

We call the function defined in Equation 9 above ` Kliesli(p) `


In light of the above result we can now state that a Functor equipped with a Monadic structure is necessarily equipped with an Applicative structure.

### Proposition 3:

If `p: A x B -> C` is a function and `M` is a monad then `p` can be lifted to a function `liftA2(p) :M A x M B -> M C` making M an Applicative Functor

Proof:

Consider the composition `eta . p : A x B ---> C ---> M C`. Now apply `Kliesli` to get `Kliesli(eta . p): M A x M B -> M C`.  


`liftA2(p) = KLiesli(eta . p)`