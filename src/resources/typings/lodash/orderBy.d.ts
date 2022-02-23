export default function <T, U>(
  array: T[] | { [key: string]: T },
  iteratees?: T[] | ((v: T) => U)[] | { [key: string]: U } | string[],
  orders?: string[],
): T[];
