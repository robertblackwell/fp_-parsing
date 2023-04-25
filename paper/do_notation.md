## `do` notation

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

