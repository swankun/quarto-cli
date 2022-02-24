/*
* break-quarto-md.test.ts
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

import { unitTest } from "../test.ts";
import { assert } from "testing/asserts.ts";
import { breakQuartoMdNew } from "../../src/core/lib/break-quarto-md.ts";
import { asMappedString } from "../../src/core/lib/mapped-text.ts";

unitTest("break-quarto-md: breakQuartoMdNew", async () => {
  const md = `---
format: html
title: "Hello!"
---

# This is a title

\`\`\`{r}
plot(1:100)
\`\`\`

* foo

* bar
`;
  const result = await breakQuartoMdNew(asMappedString(md));
  assert(result.cells.length > 0);
});
