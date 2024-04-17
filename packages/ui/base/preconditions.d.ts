export declare class Preconditions {
    static checkArgument(cond: boolean, msg?: string, ...args: any[]): asserts cond;
    static checkState(cond: boolean, msg?: string, ...args: any[]): asserts cond;
    static checkEquals(
     a: string | number | boolean | symbol | null | undefined,
     b: string | number | boolean | symbol | null | undefined,
     msg?: string,
     ...args: any[]
    ): void;
    static checkEquals(a: any, b: any, msg: string, ...args: any[]): void;
    private static stringify;
    static checkExists(x: null | undefined, msg?: string, ...args: any[]): never;
    static checkExists<T>(x: T | null | undefined, msg?: string, ...args: any[]): T;
    private static format;
}
export declare class UnreachableError extends Error {
    constructor(x: never);
}
