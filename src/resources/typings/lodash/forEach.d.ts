export default function <T>(
  obj: T[],
  f?: (
    v: T,
    key: number,
    obj: T[],
  ) => unknown,
): T[];

export default function <T>(
  obj: { [key: string]: T },
  f?: (v: T, key: string, obj: { [key: string]: T }) => unknown,
): { [key: string]: T };

export default function <T>(
  obj: T[] | { [key: string]: T },
  f?: (
    v: T,
    key: number | string,
    obj: T[] | { [key: string]: T },
  ) => unknown,
): T[] | { [key: string]: T };
