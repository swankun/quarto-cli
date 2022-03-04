/*
* ranged-text-types.ts
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

export interface Range {
  start: number;
  end: number;
}

// A ranged substring is simply a substring of some string plus the
// positional information. It's used to carry positional information of
// source code as it's processed through the system.
//
// The defining property is:
//
// const rangedSub = rangedSubstring(src, start, end);
// assert(rangedSub === src.substring(rangedSub.range.start, rangedSub.range.end));
export interface RangedSubstring {
  readonly substring: string;
  readonly range: Range;
}
