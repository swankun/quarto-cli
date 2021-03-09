/*
* format-html.ts
*
* Copyright (C) 2020 by RStudio, PBC
*
*/

import { existsSync } from "fs/mod.ts";

import { ld } from "lodash/mod.ts";

import { renderEjs } from "../core/ejs.ts";
import { mergeConfigs } from "../core/config.ts";
import { formatResourcePath } from "../core/resources.ts";
import { sessionTempFile } from "../core/temp.ts";

import {
  kFilters,
  kHeaderIncludes,
  kIncludeAfterBody,
  kIncludeBeforeBody,
  kTableOfContents,
  kToc,
  kVariables,
} from "../config/constants.ts";
import { Format, FormatExtras, kDependencies } from "../config/format.ts";
import { PandocFlags } from "../config/flags.ts";

import { Metadata } from "../config/metadata.ts";
import { baseHtmlFormat } from "./formats.ts";

export const kTheme = "theme";
export const kTocFloat = "toc-float";
export const kDocumentCss = "document-css";

export function htmlFormat(
  figwidth: number,
  figheight: number,
): Format {
  return mergeConfigs(
    baseHtmlFormat(figwidth, figheight),
    {
      metadata: {
        [kTheme]: "default",
      },
    },
    {
      formatExtras: (flags: PandocFlags, format: Format) => {
        if (format.metadata[kTheme]) {
          const theme = String(format.metadata[kTheme]);

          // 'pandoc' theme means include default pandoc document css
          if (theme === "pandoc") {
            return pandocExtras(format.metadata);

            // other themes are bootswatch themes or bootstrap css files
          } else {
            return boostrapExtras(theme, flags, format);
          }

          // theme: null means no default document css at all
        } else {
          return {
            [kVariables]: {
              [kDocumentCss]: false,
            },
          };
        }
      },
    },
  );
}

export function formatHasBootstrap(format: Format) {
  const theme = format.metadata["theme"];
  return theme && theme !== "pandoc";
}

function pandocExtras(metadata: Metadata) {
  // see if there is a max-width
  const maxWidth = metadata["max-width"];
  const headerIncludes = maxWidth
    ? `<style type="text/css">body { max-width: ${
      asCssSize(maxWidth)
    };}</style>`
    : undefined;

  return {
    [kVariables]: {
      [kDocumentCss]: true,
      [kHeaderIncludes]: headerIncludes,
    },
  };
}

function boostrapExtras(
  theme: string,
  flags: PandocFlags,
  format: Format,
): FormatExtras {
  // read options from yaml
  const metadata = format.metadata;
  const options: Record<string, string | undefined> = {
    maxwidth: maxWidthCss(metadata["max-width"]),
    margintop: asCssSizeAttrib("margin-top", metadata["margin-top"]),
    marginbottom: asCssSizeAttrib("margin-bottom", metadata["margin-bottom"]),
    marginleft: asCssSizeAttrib("margin-left", metadata["margin-left"]),
    marginright: asCssSizeAttrib("margin-right", metadata["margin-right"]),
    mainfont: asFontFamily(metadata["mainfont"]),
    fontsize: asCssSizeAttrib("font-size", metadata["fontsize"]),
    fontcolor: asCssAttrib("color", metadata["fontcolor"]),
    linkcolor: asCssAttrib("color", metadata["linkcolor"]),
    monofont: asFontFamily(metadata["monofont"]),
    monobackgroundcolor: asCssAttrib(
      "background-color",
      metadata["monobackgroundcolor"],
    ),
    linestretch: asCssAttrib("line-height", metadata["linestretch"]),
    backgroundcolor: asCssAttrib(
      "background-color",
      metadata["backgroundcolor"],
    ),
  };

  // see if this is a named bootswatch theme
  let boostrapCss = formatResourcePath(
    "html",
    `bootstrap/themes/${theme}/bootstrap.min.css`,
  );
  // otherwise could be a css file
  if (!existsSync(boostrapCss)) {
    if (existsSync(theme)) {
      boostrapCss = theme;
    } else {
      throw new Error(`Specified theme ${theme} does not exist`);
    }
  }

  const boostrapResource = (resource: string) =>
    formatResourcePath(
      "html",
      `bootstrap/themes/default/${resource}`,
    );
  const bootstrapDependency = (resource: string) => ({
    name: resource,
    path: boostrapResource(resource),
  });
  const quartoDependency = (resource: string) => ({
    name: resource,
    path: formatResourcePath("html", resource),
  });

  // process the quarto in header template
  const templateSrc = Deno.readTextFileSync(
    formatResourcePath("html", "bootstrap.quarto.css"),
  );
  const template = ld.template(templateSrc, {}, undefined);

  const quartoCss = sessionTempFile();
  Deno.writeTextFileSync(
    quartoCss,
    template(templateOptions(options)),
  );

  const toc = (flags[kToc] || format.pandoc[kToc] ||
    format.pandoc[kTableOfContents]) && (format.metadata[kTocFloat] !== false);

  const renderTemplate = (template: string) => {
    const rendered = renderEjs(
      formatResourcePath("html", `templates/${template}`),
      { toc },
    );
    const tempFile = sessionTempFile({ suffix: ".html" });
    Deno.writeTextFileSync(tempFile, rendered);
    return tempFile;
  };

  return {
    [kVariables]: {
      [kDocumentCss]: false,
    },
    [kDependencies]: [
      {
        name: "bootstrap",
        version: "v5.0.0-beta2",
        stylesheets: [
          { name: "bootstrap.min.css", path: boostrapCss },
          bootstrapDependency("bootstrap-icons.css"),
          { name: "bootstrap.quarto.css", path: quartoCss },
        ],
        scripts: [
          bootstrapDependency("bootstrap.bundle.min.js"),
          quartoDependency("bootstrap.quarto.js"),
        ],
        resources: [
          bootstrapDependency("bootstrap-icons.woff"),
        ],
      },
    ],
    [kIncludeBeforeBody]: [renderTemplate("before-body.ejs")],
    [kIncludeAfterBody]: [renderTemplate("after-body.ejs")],
    [kFilters]: {
      pre: [
        formatResourcePath("html", "html.lua"),
      ],
    },
  };
}

function templateOptions(
  options: Record<string, string | undefined>,
) {
  // provide empty string for undefined keys
  const opts = ld.cloneDeep(options);
  for (const key of Object.keys(opts)) {
    opts[key] = opts[key] || "";
  }

  // if we have a monobackground color then add padding, otherise
  // provide a default code block border treatment
  opts.monoBackground = opts.monobackgroundcolor
    ? opts.monobackgroundcolor + "  padding: 0.2em;\n"
    : undefined;
  opts.codeblockBorder = opts.monoBackground
    ? undefined
    : "  padding-left: 0.5rem;\n  border-left: 3px solid;\n";

  // return options
  return opts;
}

function maxWidthCss(value: unknown) {
  const maxWidth = asCssSize(value) || "1400px";
  return `#quarto-content {
    max-width: ${maxWidth};
  }`;
}

function asFontFamily(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  } else {
    const fontFamily = String(value)
      .split(",")
      .map((font) => {
        font = font.trim();
        if (font.includes(" ")) {
          font = `"${font}"`;
        }
        return font;
      })
      .filter((font) => font.length > 0)
      .join(", ");
    return `  font-family: ${fontFamily};\n`;
  }
}

function asCssAttrib(attrib: string, value: unknown): string | undefined {
  if (!value) {
    return undefined;
  } else {
    return `  ${attrib}: ${String(value)};\n`;
  }
}

function asCssSizeAttrib(attrib: string, value: unknown): string | undefined {
  const size = asCssSize(value);
  return asCssAttrib(attrib, size);
}

function asCssSize(value: unknown): string | undefined {
  if (typeof (value) === "number") {
    if (value === 0) {
      return "0";
    } else {
      return value + "px";
    }
  } else if (!value) {
    return undefined;
  } else {
    const str = String(value);
    if (str !== "0" && !str.match(/\w$/)) {
      return str + "px";
    } else {
      return str;
    }
  }
}
