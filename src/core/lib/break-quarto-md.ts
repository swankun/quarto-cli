/*
* break-quarto-md.ts
*
* Breaks up a qmd file into a list of chunks of related text: YAML
* front matter, "pure" markdown, triple-backtick sections, and so on.
*
* Copyright (C) 2021 by RStudio, PBC
*
*/

import { lineOffsets, lines } from "./text.ts";
import { Range, rangedLines, RangedSubstring } from "./ranged-text.ts";
import { MappedString, mappedString } from "./mapped-text.ts";

// @deno-types="@types/commonmark";
import { Node } from "commonmark";

import { parseMarkdown } from "./commonmark.ts";

import { partitionCellOptionsMapped } from "./partition-cell-options.ts";

export interface CodeCellType {
  language: string;
}

export interface QuartoMdCell {
  id?: string;

  // deno-lint-ignore camelcase
  cell_type: CodeCellType | "markdown" | "raw" | "math";
  options?: MappedString;

  source: MappedString;
  sourceVerbatim: MappedString;

  sourceOffset: number; // FIXME these might be unnecessary now. Check back

  // line number of the start of the cell in the file, 0-based.
  //
  // NB this number means slightly different things depending on the
  // cell type. for markdown and raw cells, it's literally the first
  // line in the file corresponding to the cell. for code cells,
  // though, it's the first line of the _content_: it skips the triple
  // ticks.
  sourceStartLine: number;

  cellStartLine: number;
}

export interface QuartoMdChunks {
  cells: QuartoMdCell[];
}

// deno-lint-ignore require-await
export async function breakQuartoMdNew(
  src: MappedString,
  validate = false,
) {
  const nb: QuartoMdChunks = {
    cells: [],
  };

  let parse: Node | null = parseMarkdown(src)?.firstChild || null;
  const originalParse: Node | null = parse;
  if (originalParse === null) {
    return nb;
  }

  debugger;

  const startCodeCellRegEx = new RegExp(
    "^\\s*```+\\s*\\{([=A-Za-z]+)( *[ ,].*)?\\}\\s*$",
  );

  const offsets = Array.from(lineOffsets(src.value));
  const srcLines = lines(src.value);

  const sourceposStartToOffset = (pos: [number, number]) =>
    offsets[pos[0] - 1] + pos[1] - 1;
  const sourceposEndToOffset = (pos: [number, number]) =>
    // + 1 = -1 + 1 + 1;
    // -1 because pos is one-indexed;
    // +1 because commonmark returns closed interval
    // +1 because commonmark doesn't return the newline and we want to capture it.
    offsets[pos[0] - 1] + pos[1] + 1;

  type ParseState = "start" | "markdown" | "chunk";

  let state: ParseState = "start";

  const toYamlChunk = (node: Node): QuartoMdCell => {
    const source = mappedString(src, [{
      start: sourceposStartToOffset(node.sourcepos[0]),
      end: sourceposEndToOffset(node.sourcepos[1]),
    }]);
    const nodeType = node.type as string;
    if (nodeType !== "yaml_block") {
      throw new Error("Internal Error: expected a YAML block");
    }
    return {
      cell_type: "raw",
      source,
      sourceOffset: 0,
      sourceStartLine: 0,
      sourceVerbatim: source,
      cellStartLine: node.sourcepos[0][0] - 1,
    };
  };
  const toCodeChunk = async (node: Node): Promise<QuartoMdCell> => {
    const m = srcLines[node.sourcepos[0][0] - 1].match(startCodeCellRegEx);
    if (m === null) {
      throw new Error("Internal Error: should have recognized a code chunk");
    }
    const language = m[1];
    const chunkStartLine = node.sourcepos[0][0] - 1;
    const chunkEndLine = node.sourcepos[1][0] - 1;
    let source = mappedString(src, [{
      start: sourceposStartToOffset(node.sourcepos[0]),
      end: sourceposEndToOffset(node.sourcepos[1]),
    }]);
    source = mappedString(source, [{
      start: offsets[chunkStartLine + 1] - offsets[chunkStartLine],
      end: offsets[chunkEndLine] - offsets[chunkStartLine],
    }]);

    const { yaml, source: resultSource, sourceStartLine } =
      await partitionCellOptionsMapped(
        language,
        source,
        validate,
      );

    return {
      cell_type: { language },
      source: resultSource,
      options: yaml,
      sourceOffset: offsets[chunkStartLine + 1] - offsets[chunkStartLine],
      sourceStartLine,
      sourceVerbatim: source,
      cellStartLine: node.sourcepos[0][0] - 1,
    };
  };
  const toMarkdownChunk = (nodeStart: Node, nodeEnd: Node): QuartoMdCell => {
    const source = mappedString(src, [{
      start: sourceposStartToOffset(nodeStart.sourcepos[0]),
      end: sourceposEndToOffset(nodeEnd.sourcepos[1]),
    }]);
    return {
      cell_type: "markdown",
      source,
      sourceOffset: 0,
      sourceStartLine: 0,
      sourceVerbatim: source,
      cellStartLine: nodeStart.sourcepos[0][0] - 1,
    };
  };

  let cellBlockStartNode: Node;
  while (parse !== null) {
    const node: Node | null = parse;
    const nodeType = node.type as string; // we upcast to string to catch the "yaml_block" hack from commonmark.ts

    switch (state) {
      case "start":
        if (nodeType === "yaml_block") {
          nb.cells.push(toYamlChunk(node));
        } else if (nodeType === "code_block") {
          nb.cells.push(await toCodeChunk(node));
        } else {
          cellBlockStartNode = node;
          state = "markdown";
        }
        break;
      case "markdown":
        if (nodeType === "yaml_block") {
          nb.cells.push(toMarkdownChunk(cellBlockStartNode!, parse.prev!));
          nb.cells.push(toYamlChunk(node));
          state = "start";
        } else if (
          nodeType === "code_block" &&
          srcLines[node.sourcepos[0][0] - 1].match(startCodeCellRegEx)
        ) {
          nb.cells.push(toMarkdownChunk(cellBlockStartNode!, parse.prev!));
          nb.cells.push(await toCodeChunk(node));
          state = "start";
        }
        break;
    }
    parse = node.next;

    // 'text' |'softbreak' | 'linebreak' | 'emph' | 'strong' | 'html_inline' | 'link' | 'image' | 'code' | 'document' | 'paragraph' |
    // 'block_quote' | 'item' | 'list' | 'heading' | 'code_block' | 'html_block' | 'thematic_break' | 'custom_inline' | 'custom_block';

    /*  switch (nodeType) {
    }
    parse = parse.next;
 */
  }
  if (state === "markdown") {
    nb.cells.push(
      toMarkdownChunk(cellBlockStartNode!, originalParse.lastChild!),
    );
  }
  return nb;
}

export async function breakQuartoMd(
  src: MappedString,
  validate = false,
) {
  // notebook to return
  const nb: QuartoMdChunks = {
    cells: [],
  };

  // regexes
  const yamlRegEx = /^---\s*$/;
  const startCodeCellRegEx = new RegExp(
    "^\\s*```+\\s*\\{([=A-Za-z]+)( *[ ,].*)?\\}\\s*$",
  );
  const startCodeRegEx = /^```/;
  const endCodeRegEx = /^```\s*$/;
  const delimitMathBlockRegEx = /^\$\$/;
  let language = ""; // current language block
  let cellStartLine = 0;

  // line buffer
  const lineBuffer: RangedSubstring[] = [];
  const flushLineBuffer = async (
    cell_type: "markdown" | "code" | "raw" | "math",
    index: number,
  ) => {
    if (lineBuffer.length) {
      // TODO understand why was this here. This makes our line
      // count computations wrong
      //
      // if (lineBuffer[lineBuffer.length - 1].substring === "") {
      //   lineBuffer.splice(lineBuffer.length - 1, 1);
      // }

      const mappedChunks: (string | Range)[] = [];
      for (const line of lineBuffer) {
        mappedChunks.push(line.range);
      }

      const source = mappedString(src, mappedChunks);

      // const sourceLines = lineBuffer.map((line, index) => {
      //   return mappedString(line + (index < (lineBuffer.length - 1) ? "\n" : "");
      // });

      const cell: QuartoMdCell = {
        // deno-lint-ignore camelcase
        cell_type: cell_type === "code" ? { language } : cell_type,
        source: source,
        sourceOffset: 0,
        sourceStartLine: 0,
        sourceVerbatim: source,
        cellStartLine,
      };

      // the next cell will start on the next index.
      cellStartLine = index + 1;

      if (cell_type === "code" && (language === "ojs" || language === "dot")) {
        // see if there is embedded metadata we should forward into the cell metadata
        const { yaml, source, sourceStartLine } =
          await partitionCellOptionsMapped(
            language,
            cell.source,
            validate,
          );
        // TODO I'd prefer for this not to depend on sourceStartLine now
        // that we have mapped strings infrastructure
        const breaks = Array.from(lineOffsets(cell.source.value)).slice(1);
        let strUpToLastBreak = "";
        if (sourceStartLine > 0) {
          if (breaks.length) {
            const lastBreak =
              breaks[Math.min(sourceStartLine - 1, breaks.length - 1)];
            // const pos = lastBreak.index + lastBreak[0].length;
            strUpToLastBreak = cell.source.value.substring(0, lastBreak);
          } else {
            strUpToLastBreak = cell.source.value;
          }
        }
        cell.sourceOffset = strUpToLastBreak.length + "```{ojs}\n".length;
        cell.sourceVerbatim = mappedString(
          cell.sourceVerbatim,
          [
            "```{ojs}\n",
            { start: 0, end: cell.sourceVerbatim.value.length },
            "\n```",
          ],
        );
        cell.source = source;
        cell.options = yaml;
        cell.sourceStartLine = sourceStartLine;
      }

      // if the source is empty then don't add it
      if (mdTrimEmptyLines(lines(cell.source.value)).length > 0) {
        nb.cells.push(cell);
      }

      lineBuffer.splice(0, lineBuffer.length);
    }
  };

  // loop through lines and create cells based on state transitions
  let inYaml = false,
    inMathBlock = false,
    inCodeCell = false,
    inCode = false;

  const srcLines = rangedLines(src.value, true);

  for (let i = 0; i < srcLines.length; ++i) {
    const line = srcLines[i];
    // yaml front matter
    if (
      yamlRegEx.test(line.substring) && !inCodeCell && !inCode && !inMathBlock
    ) {
      if (inYaml) {
        lineBuffer.push(line);
        await flushLineBuffer("raw", i);
        inYaml = false;
      } else {
        await flushLineBuffer("markdown", i);
        lineBuffer.push(line);
        inYaml = true;
      }
    } // begin code cell: ^```python
    else if (startCodeCellRegEx.test(line.substring)) {
      const m = line.substring.match(startCodeCellRegEx);
      language = (m as string[])[1];
      await flushLineBuffer("markdown", i);
      inCodeCell = true;

      // end code block: ^``` (tolerate trailing ws)
    } else if (endCodeRegEx.test(line.substring)) {
      // in a code cell, flush it
      if (inCodeCell) {
        inCodeCell = false;
        await flushLineBuffer("code", i);

        // otherwise this flips the state of in-code
      } else {
        inCode = !inCode;
        lineBuffer.push(line);
      }

      // begin code block: ^```
    } else if (startCodeRegEx.test(line.substring)) {
      inCode = true;
      lineBuffer.push(line);
    } else if (delimitMathBlockRegEx.test(line.substring)) {
      if (inMathBlock) {
        await flushLineBuffer("math", i);
      } else {
        if (inYaml || inCode || inCodeCell) {
          // TODO signal a parse error?
          // for now, we just skip.
        } else {
          await flushLineBuffer("markdown", i);
        }
      }
      inMathBlock = !inMathBlock;
      lineBuffer.push(line);
    } else {
      lineBuffer.push(line);
    }
  }

  // if there is still a line buffer then make it a markdown cell
  await flushLineBuffer("markdown", srcLines.length);

  return nb;
}

function mdTrimEmptyLines(lines: string[]) {
  // trim leading lines
  const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
  if (firstNonEmpty === -1) {
    return [];
  }
  lines = lines.slice(firstNonEmpty);

  // trim trailing lines
  let lastNonEmpty = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().length > 0) {
      lastNonEmpty = i;
      break;
    }
  }

  if (lastNonEmpty > -1) {
    lines = lines.slice(0, lastNonEmpty + 1);
  }

  return lines;
}
