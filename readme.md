# Lessons in, passing, returning and currying, Typescript overloaded function

This is a learning project only. 

It came about when I was asked a question about how to wrap the __got__ function from [https://github.com/sindresorhus/got](https://github.com/sindresorhus/got) with application specific URL end points, and json return types to provide an application specific api.

The tricky part of the assignment was to:

-     do this in a way that preserved the `got` function feature whereby the api would be able to return a full responses or just the response body (in different format) without having a specific function for each return type.

-   and to do it in a way that the type system does not have to be "forced"

This of course (I can say that now that I have done the work) led to the realization that the `got` function is an __overloaded function__, which led to a dive into Typescript overloaded functions and:

-   how to create then,
-   how to pass them to other functions,
-   how to return them from ordinary functions, and
-   how to 'curry' them.

along the way I learned that:

```
type A =  {resolveBodyOnly: true}
```
```
type B =  {resolveBodyOnly: false}
```

are different types, and that realization is at the heart of this little project.

## Usage

Run `src/main.ts` using the __vscode__ (or some other ) debugger. That way you can observe the different return values and their types.

Note that in `src/main.ts` almost all variables have explicit types, this is so that the vscode linter can highlight any type inconsistencies. There are none (on my system) and hence the api is type conformant which was one of the aims of the exercise. 

## whiteacorn, what is it

Its my travel website. I chose to use some of the json end points exposed by this site for this project simply because a) I know it b) it is up and running without any additional effort.
