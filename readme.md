## Monads and Applicatives


https://stackoverflow.com/questions/45712106/why-are-promises-monads

https://write.yiransheng.com/callcc

https://itnext.io/continuations-in-typescript-db18402010bc

https://curiosity-driven.org/monads-in-javascript

https://maxhallinan.com/posts/2019/10/22/how-does-the-continuation-monad-work/

### Functor
```haskell
class Functor f where
    fmap :: (a -> b) -> f a -> f b
    (<$) :: a -> f b -> f a
```
### Applicative 

``` haskell
class Functor f => Applicative f where
    pure  :: a -> m a
    (<*>) :: m (a->b) -> m a -> mb
    or
    liftA2 :: (a -> b -> c)  ->  (m a -> m b -> m c)

    (<*>) and liftA2 are related by the following equations:

    (<*>) = liftA2 id
    liftA2 f x y = f <$> x <*> y

    see Note below by RB

    where <$> is apply fmap and then evaluate
    (<$>)   :: (a -> b) -> m a -> m b 
    \fab -> (\ma -> fmap(fab)(ma)) 

``` 

### Note 1 - liftA2 from <*>
 Regarding 
 ```haskell
 liftA2 f x y = f <$> x <*> y
 
liftA2 :: (a -> (b -> c) -> (m a -> (m b -> m c))

fmap :: (a -> (b -> c)) -> (m a -> m (b -> c))

If f :: a -> (b -> c) then fmap f :: m a -> m (b -> c) and 
```
`fmap f ma` is of type `m (b -> c)` and hence is a suitable first argument for `<*>`
select a second argument `fmbc` of type `m (b -> c)`

then
```haskell 
    fmap f ma <*> fmbc is of type (m a -> m b)
```
putting this all together

liftA2 f ma fmbc = fmap f ma <*> fmbc 

```
### NOTE 2 - <*> from liftA2
```haskell
(<*>) = liftA2 id

liftA2 :: (a -> (b -> c)) -> (f a -> (f b -> f c))

lets replace a with (b -> c)

liftA2 :: ((b -> c) -> (b -> c)) -> (f (b -> c) -> (f b -> f c))

now evaluate liftA2 on the 

identity :: (b -> c) -> (b -> c)

liftA2 identity :: f (b -> c) -> (f b -> f c) as required
```
### Haskel definition of a Monad

```haskell
class Monad m where
   (>>=)  :: m a -> (  a -> m b) -> m b
   (>>)   :: m a ->  m b         -> m b
   return ::   a                 -> m a
```


### View a Monad as an Applicative

```haskell
fmap fab ma  =  do { a <- ma ; return (fab a) }
            --  ma >>= (return . fab)
pure a       =  do { return a }
            --  return a
mfab <*> ma  =  do { fab <- mfab ; a <- ma ; return (fab a) }
            --  mfab >>= (\ fab -> ma >>= (return . fab)) 
            --  mfab `ap` ma
```

### Analysis of applicative definitions

Let `fab` be a function of type `a -> b`.

The expression `return . fab` is the composition `fab` followed by `return` as in
```haskell
    a -> b -> m b
```

Let `ma` be a value of type `m a` then we can form the value `ma >>= return .fab` which is 
a value of type `m b`. Call that value `mb` and note it depends on `fab` and `ma`.

The function `\fab -> ma >>= (return . fab)` is of type `(a -> b) -> m b`. 

For convenience call this function `g :: (a -> b) -> m b`. 

We take out the dependency of `ma` we could denote this as `h: m a -> ((a -> b) -> m b)`
so that `g` is simple `h` evaluated at `ma`.

For any value `mfab` of type `m (a -> b)` we can form the value `mfab >>= h(ma)` which is
of type `m b`.  

The expression `mfab >>= h(ma)` is the definition of `mfab <*> ma`


## Kliesli extension

The Kliesli condition is a characteristic of a monad that fully defines the monad.

It states that for every 

```haskell
f :: a -> m b 
```
there exists a unique

```haskell
Kliesli(f) :: m a -> m b
```
such that

```haskell
f = (Kliesli(f) . return) :: a -> m am -> m b
```

Given the Monad definition the Kliesli extension is defined as:
```haskell
KLiesli(f) = mu . fmap(f) :: m a -> m m b -> m b
```
or for `f::a -> m b` and `ma` in `m a` 
```haskell
Kliesli(f)(ma) = f >>= ma
``` 

## All function m a -> m b are KLiesli extensions

Consider a map `f :: m a -> m b` some simple diagram chasing will demonstrate that
for all `ma :: (m a) ` `kliesli(f . pure)(ma) = (\a -> kliesli(f . pure)(ma) = f(ma)`
which is just another way of saying `kliesli(f . pure) = f`.

That is the function `kliesli :: (a -> m b) -> (ma -> mb)` and `(\f -> f . pure) :: (m a -> m b) -> (a -> m b)`
constitute an isomorphism.

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
This is tested in parser_applicative.ts

