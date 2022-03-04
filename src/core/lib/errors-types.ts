/*
* errors-types.ts
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

export interface ErrorLocation {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

export interface TidyverseError {
  heading: string;
  error: string[];
  info: Record<string, string>; // use tag for infos to only display one error of each tag
  fileName?: string;
  location?: ErrorLocation;
  sourceContext?: string;
}
