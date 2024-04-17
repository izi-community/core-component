export class Preconditions {
    static checkArgument(cond, msg, ...args) {
        if (!cond) {
            throw new Error(msg == null ? 'invalid argument' : Preconditions.format(msg, ...args));
        }
    }
    static checkState(cond, msg, ...args) {
        if (!cond) {
            throw new Error(msg == null ? 'invalid state' : Preconditions.format(msg, ...args));
        }
    }
    static checkEquals(a, b, msg, ...args) {
        if (a !== b) {
            throw new Error(msg == null
                ? Preconditions.format('{} != {}', Preconditions.stringify(a), Preconditions.stringify(b))
                : Preconditions.format(msg, ...args));
        }
    }
    static stringify(x) {
        if (x == null || typeof x === 'symbol') {
            return String(x);
        }
        else {
            try {
                return JSON.stringify(x);
            }
            catch (e) {
                return String(x);
            }
        }
    }
    static checkExists(x, msg, ...args) {
        if (x == null) {
            throw new Error(msg == null ? 'argument is null' : Preconditions.format(msg, ...args));
        }
        return x;
    }
    static format(template, ...args) {
        let i = 0;
        return template.replace(/\{}/g, () => (i < args.length ? args[i++] : '{}'));
    }
}
export class UnreachableError extends Error {
    constructor(x) {
        super(`unhandled case: ${JSON.stringify(x)}`);
    }
}
