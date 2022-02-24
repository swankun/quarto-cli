/*
* commonmark.ts
*
* Interface with the commonmark.js reference parser
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

// @deno-types="@types/commonmark";
import { Node, NodeType, Parser } from "commonmark";

import { MappedString } from "./mapped-text.ts";

import { lines } from "./text.ts";

////////////////////////////////////////////////////////////////////////////////

export function parseMarkdown(
  src: MappedString,
) {
  const reader = new Parser();
  const parse = reader.parse(src.value);
  const srcLines = lines(src.value);

  // we do a bit of tree surgery here to create yaml blocks.
  let maybeYamlStart: Node | null = null;
  let node = parse.firstChild;
  if (node === null) {
    return parse;
  }
  while (node !== null) {
    if (node.type === "thematic_break") {
      maybeYamlStart = node;
      node = node.next;
    } else if (
      maybeYamlStart &&
      node.type === "heading" &&
      node.level === 2 &&
      srcLines[node.sourcepos[1][0] - 1] === "---"
    ) {
      // now check if the node's text ends with '---'
      const prev = maybeYamlStart!.prev;
      const next: Node | null = node.next;

      // we kind of cheat here by forcing a node type that doesn't exist, but it's ok
      // because it works.
      const newNode = new Node("yaml_block" as NodeType, [
        maybeYamlStart!.sourcepos[0],
        node.sourcepos[1],
      ]);
      let n: Node | null = maybeYamlStart!;
      do {
        const nn: Node | null = n.next;
        newNode.appendChild(n);
        n = nn;
      } while (n && n !== next);
      if (prev === null) {
        parse.firstChild!.insertBefore(newNode);
      } else {
        prev.insertAfter(newNode);
      }
      maybeYamlStart = null;
      node = next;
    } else {
      node = node.next;
    }
  }

  return parse;
}
