import { kSelfContained } from "../../config/constants.ts";

export const kStdOut = "-";

export interface RenderFlags {
  to?: string;
  output?: string;
  pdfEngine?: string;
  pdfEngineOpts?: string[];
  natbib?: boolean;
  biblatex?: boolean;
  params?: string;
  computeDir?: string;
  keepAll?: boolean;
  quiet?: boolean;
  [kSelfContained]?: boolean;
}

export function parseRenderFlags(args: string[]) {
  const flags: RenderFlags = {};

  const argsStack = [...args];
  let arg = argsStack.shift();
  while (arg !== undefined) {
    switch (arg) {
      case "-t":
      case "--to":
        arg = argsStack.shift();
        if (arg && !arg.startsWith("-")) {
          flags.to = arg;
        }
        break;

      case "-o":
      case "--output":
        arg = argsStack.shift();
        if (!arg || arg.startsWith("-")) {
          flags.output = kStdOut;
        } else {
          flags.output = arg;
        }
        break;

      case "--pdf-engine":
        arg = argsStack.shift();
        flags.pdfEngine = arg;
        break;

      case "--pdf-engine-opt":
        arg = argsStack.shift();
        if (arg) {
          flags.pdfEngineOpts = flags.pdfEngineOpts || [];
          flags.pdfEngineOpts.push(arg);
        }
        break;

      case "--natbib":
        arg = argsStack.shift();
        flags.natbib = true;
        break;

      case "--biblatex":
        arg = argsStack.shift();
        flags.biblatex = true;
        break;

      case "--params":
        arg = argsStack.shift();
        flags.params = arg;
        break;

      case "--compute-dir":
        arg = argsStack.shift();
        flags.computeDir = arg;
        break;

      case "--keep-all":
        arg = argsStack.shift();
        flags.keepAll = true;
        break;

      case "--quiet":
        flags.quiet = true;
        arg = argsStack.shift();
        break;

      case "--self-contained":
        flags[kSelfContained] = true;
        arg = argsStack.shift();
        break;

      default:
        arg = argsStack.shift();
        break;
    }
  }

  return flags;
}

export function replacePandocArg(
  pandocArgs: string[],
  arg: string,
  value: string,
) {
  const newArgs = [...pandocArgs];
  const argIndex = pandocArgs.indexOf(arg);
  if (argIndex !== -1) {
    newArgs[argIndex + 1] = value;
  } else {
    newArgs.push(arg);
    newArgs.push(value);
  }
  return newArgs;
}

// repair 'damage' done to pandoc args by cliffy (e.g. the - after --output is dropped)
export function fixupPandocArgs(pandocArgs: string[], flags: RenderFlags) {
  // --output - gets eaten by cliffy, re-inject it if necessary
  pandocArgs = pandocArgs.reduce((args, arg, index) => {
    args.push(arg);
    if (
      flags.output === kStdOut &&
      pandocArgs[index + 1] !== kStdOut &&
      (arg === "-o" || arg === "--output")
    ) {
      args.push(kStdOut);
    }
    return args;
  }, new Array<string>());

  // remove other args as needed
  const removeArgs = new Map<string, boolean>();
  removeArgs.set("--params", true);
  removeArgs.set("--keep-all", false);
  removeArgs.set("--compute-dir", true);
  let removeNext = false;
  return pandocArgs.reduce((args, arg) => {
    if (!removeArgs.has(arg)) {
      if (!removeNext) {
        args.push(arg);
      }
      removeNext = false;
    } else {
      removeNext = removeArgs.get(arg)!;
    }
    return args;
  }, new Array<string>());
}
