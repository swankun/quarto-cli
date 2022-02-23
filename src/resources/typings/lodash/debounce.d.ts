// it would be nice to know how to type a fully generic function type. Oh well.
export default function <T>(
  f: () => T,
  wait?: number,
  options?: { leading?: boolean; trailing?: boolean },
): () => T;

export default function <T, T1>(
  f: (p1: T1) => T,
  wait?: number,
  options?: { leading?: boolean; trailing?: boolean },
): (p1: T1) => T;

export default function <T, T1, T2>(
  f: (p1: T1, p2: T2) => T,
  wait?: number,
  options?: { leading?: boolean; trailing?: boolean },
): (p1: T1, p2: T2) => T;

export default function <T, T1, T2, T3>(
  f: (p1: T1, p2: T2, p3: T3) => T,
  wait?: number,
  options?: { leading?: boolean; trailing?: boolean },
): (p1: T1, p2: T2, p3: T3) => T;
