/*
* commonmark.test.ts
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

import { parseMarkdown } from "../../src/core/lib/commonmark.ts";
import { asMappedString } from "../../src/core/lib/mapped-text.ts";

import { unitTest } from "../test.ts";
import { assert } from "testing/asserts.ts";

// deno-lint-ignore require-await
unitTest("commonmark.ts - simple tests", async () => {
  const md = `---
title: 'foo'

format: html
---

# Hello *world*

Here is a paragraph. This paragraph has some math. $y=x^2$.

$$Some equation math by itself.$$

\`\`\`{python .a-class some-attribute='some-value'}
import math
\`\`\`

<div class=\"this-is-a-div\">
With some stuff
</div>
`;

  debugger;
  const parse = parseMarkdown(asMappedString(md));

  assert(parse.firstChild.type === "yaml_block");
});
