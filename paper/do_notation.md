## `do` notation

What problem does the haskell `do` solve.

Consider you have two functions `f :: X -> M A` and `g :: Y -> M B` which do some
caclulation that prepare input for a final "bring it all together" calculation
represented by a function `k :: (A, B) -> M C`.

As you can see all of these functions produce a `Monadic` result, maybe each calculation 
required some `IO` and ma have failed so `M A` ma equal `IO Maybe A`. But for the moment
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

The haskell solution is

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
```typescript

Translating this into a hypothetical monad `M` yields (ignoring generic parameters)

function combine(ma: M<A>, mb: M<B>, k: (A, B) -> M<C>)
    
    M.bind(ma, (a) => M.bind(mb, (b) => k(a,b)))

}
```
This is tested and demonstrated in file `tests/test_do.ts`.

