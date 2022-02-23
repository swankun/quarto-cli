// I believe mergeWith is effectively impossible to type correctly in typescript.
// the issue is that the customizer is the last parameter instead of the second; so we can't type the ...rest part

// deno-lint-ignore no-explicit-any
export default function <T>(param: T, ...params: any[]): T;
