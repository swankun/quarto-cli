export default function (
  str?: string,
  options?: {
    escape?: RegExp;
    evaluate?: RegExp;
    imports?: { [key: string]: unknown };
    interpolate?: RegExp;
    sourceURL?: string;
    variable?: string;
  },
): (...values: unknown[]) => string;
