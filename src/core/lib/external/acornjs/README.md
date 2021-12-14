# acornjs

[`acornjs`](https://github.com/acornjs/acorn).

We will temporarily keep (patched) local copies of acorn, to work
around what appears to be a bug in the deno bundler related to
clashing internal names.

To get these files:

```
$ git clone git@github.com:acornjs/acorn.git
$ cd acorn
$ npm install
$ npm run build
$ cp acorn/dist/acorn.mjs ${QUARTO_ROOT}/src/core/lib/external/acorn/acorn.js
$ cp acorn-walk/dist/walk.mjs ${QUARTO_ROOT}/src/core/lib/external/acorn/walk.js
```

Note, though, that:

- `acorn.js` is a _patched_ local copy of `acorn/dist/acorn.mjs`
- `walk.js` is a _patched_ local copy of `acorn-walk/dist/walk.mjs`
