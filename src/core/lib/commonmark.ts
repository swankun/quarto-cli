/*
* commonmark.ts
*
* Interface with the commonmark.js reference parser
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

import * as cm from "commonmark";

import { MappedString } from "./mapped-text.ts";

import { lines } from "./text.ts";

////////////////////////////////////////////////////////////////////////////////

export function parseMarkdown(
  src: MappedString,
) {
  const reader = cm.Parser();
  const parse = reader.parse(src.value);
  const srcLines = lines(src.value);

  // we do a bit of tree surgery here to create yaml blocks.
  let maybeYamlStart;
  let node = parse.firstChild;
  while (node !== null) {
    if (node.type === "thematic_break") {
      maybeYamlStart = node;
      node = node.next;
    } else if (
      node.type === "heading" &&
      node.level === 2 &&
      srcLines[node.sourcepos[1][0] - 1] === "---"
    ) {
      // now check if the node's text ends with '---'
      const prev = maybeYamlStart.prev;
      const next = node.next;
      const newNode = new cm.Node("yaml_block", [
        maybeYamlStart.sourcepos[0],
        node.sourcepos[1],
      ]);
      let n = maybeYamlStart;
      do {
        const nn = n.next;
        newNode.appendChild(n);
        n = nn;
      } while (n !== next);
      if (prev === null) {
        parse.firstChild.insertBefore(newNode);
      } else {
        prev.insertAfter(newNode);
      }
      node = next;
    } else {
      node = node.next;
    }
  }

  return parse;
}
