/**
 * mapped-text-types.ts
 *
 * Copyright (C) 2022 by RStudio, PBC
 */

export interface MappedString {
  readonly value: string;
  readonly originalString: string;
  readonly fileName?: string;
  map: (a: number) => number | undefined;
  mapClosest: (a: number) => number | undefined;
}

export type EitherString = string | MappedString;
export type StringChunk = string | Range;
