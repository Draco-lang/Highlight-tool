
/**
 * Constructs a regex pattern from a regex string.
 * @param r The regex string.
 * @returns The constructed regex pattern.
 */
export function regex(r: string): IPattern {
    return new RegexPattern(r);
}

/**
 * Constructs a literal pattern from a string.
 * @param l The literal string.
 * @returns The constructed literal pattern.
 */
export function literal(l: string): IPattern {
    return new RegexPattern(escapeRegex(l));
}

/**
 * Concatenates patterns into a sequence.
 * @param ps The patterns to concatenate.
 * @returns The concatenated pattern.
 */
export function cat(...ps: IPattern[]): IPattern {
    return ps.reduce((acc, p) => new SeqPattern(acc, p));
}

/**
 * Concatenates patterns into an alternation.
 * @param ps The patterns to concatenate.
 * @returns The concatenated pattern.
 */
export function or(...ps: IPattern[]): IPattern {
    return ps.reduce((acc, p) => new AltPattern(acc, p));
}

/**
 * Constructs a repetition pattern.
 * @param p The pattern to repeat.
 * @param min The minimum number of repetitions.
 * @param max The maximum number of repetitions.
 * @returns The constructed repetition pattern.
 */
export function rep(p: IPattern, min: number, max?: number): IPattern {
    return new RepPattern(p, min, max);
}

/**
 * Shorthand for @see rep.
 */
export function rep0(...ps: IPattern[]): IPattern {
    return rep(cat(...ps), 0, undefined);
}

/**
 * Shorthand for @see rep.
 */
export function rep1(...ps: IPattern[]): IPattern {
    return rep(cat(...ps), 1, undefined);
}

/**
 * Shorthand for @see rep.
 */
export function opt(...ps: IPattern[]): IPattern {
    return rep(cat(...ps), 0, 1);
}

/**
 * Shorthand for @see rep.
 */
export function atMost(p: IPattern, max: number): IPattern {
    return rep(p, 0, max);
}

/**
 * Shorthand for @see rep.
 */
export function atLeast(p: IPattern, min: number): IPattern {
    return rep(p, min, undefined);
}

/**
 * Shorthand for @see rep.
 */
export function between(p: IPattern, min: number, max: number): IPattern {
    return rep(p, min, max);
}

/**
 * Shorthand for @see rep.
 */
export function exactly(p: IPattern, n: number): IPattern {
    return rep(p, n, n);
}

/**
 * Captures a pattern with a name.
 * @param ps The pattern to capture.
 * @param name The name to give to the capture.
 * @returns The capture pattern.
 */
export function capture(p: IPattern, name: string): IPattern {
    return new CapturePattern(p, name);
}

/**
 * Creates a lookahead pattern.
 * @param p The pattern to consider lookahead.
 * @param negate True, if the pattern should be negated.
 * @returns The constructed lookahead pattern.
 */
export function lookahead(p: IPattern, negate: boolean = false): IPattern {
    return new LookaroundPattern(p, false, negate);
}

/**
 * Creates a lookbehind pattern.
 * @param p The pattern to consider lookbehind.
 * @param negate True, if the pattern should be negated.
 * @returns The constructed lookbehind pattern.
 */
export function lookbehind(p: IPattern, negate: boolean = false): IPattern {
    return new LookaroundPattern(p, true, negate);
}

var captureCnt = 0;
/**
 * Appends tags onto a pattern.
 * @param p The pattern to append the tags onto.
 * @param tags The tags to append.
 */
export function tag(p: IPattern, ...tags: any[]): IPattern {
    // Capture the pattern, if needed
    if (!(p instanceof CapturePattern)) p = capture(p, `tagCapture_${captureCnt++}`);
    return new TagPattern(p, tags);
}

/**
 * Represents a pattern that can be translated to a regular expression.
 */
export interface IPattern {
    /**
     * Translates this pattern to a regular expression.
     */
    toRegex(): RegexResult;

    /**
     * Retrieves the underlying pattern, in case this is a metadata element with no
     * contrinution to the regex output.
     */
    contentElement(): IPattern;

    // Builder style functions

    /**
     * Alias for @see capture.
     */
    capture(name: string): IPattern;

    /**
     * Alias for @see tag.
     */
    tag(...tags: any[]): IPattern;
}

/**
 * The result of building a regex.
 */
type RegexResult = {
    /**
     * The built regex.
     */
    regex: string;

    /**
     * The precedence of the regex construct returned.
     */
    precedence: number;

    /**
     * The total number of capture groups, including the unnamed ones.
     */
    captureGroupCount: number;

    /**
     * The named capture groups mapped from name to the corresponding pattern.
     */
    captureNames: Map<string, IPattern>;

    /**
     * The capture groups mapped from the pattern to the group number.
     */
    captureGroups: Map<IPattern, number>;

    /**
     * The tags appended to patterns.
     */
    tags: Map<IPattern, any[]>;
};

export abstract class PatternBase implements IPattern {
    constructor() { }

    abstract toRegex(): RegexResult;

    abstract contentElement(): IPattern;

    capture(name: string): IPattern {
        return capture(this, name);
    }

    tag(...tags: any[]): IPattern {
        return tag(this, ...tags);
    }
}

class RegexPattern extends PatternBase {
    constructor(private text: string) { super(); }

    toRegex(): RegexResult {
        let stats = regexStats(this.text);
        return {
            regex: this.text,
            precedence: stats.precedence,
            captureGroupCount: stats.captureGroupCount,
            captureNames: new Map(),
            captureGroups: new Map(),
            tags: new Map(),
        };
    }

    contentElement(): IPattern {
        return this;
    }
}

class AltPattern extends PatternBase {
    constructor(private first: IPattern, private second: IPattern) { super(); }

    toRegex(): RegexResult {
        let a = groupForPrecedence(this.first.toRegex(), Precedence.ALT);
        let b = groupForPrecedence(this.second.toRegex(), Precedence.ALT);
        return {
            regex: `${a.regex}|${b.regex}`,
            precedence: Precedence.ALT,
            captureGroupCount: a.captureGroupCount + b.captureGroupCount,
            captureNames: mergeMaps(a.captureNames, b.captureNames),
            captureGroups: mergeMaps(a.captureGroups, shiftCaptureGroups(b.captureGroups, a.captureGroupCount)),
            tags: mergeMaps(a.tags, b.tags),
        };
    }

    contentElement(): IPattern {
        return this;
    }
}

class SeqPattern extends PatternBase {
    constructor(private first: IPattern, private second: IPattern) { super(); }

    toRegex(): RegexResult {
        let a = groupForPrecedence(this.first.toRegex(), Precedence.SEQ);
        let b = groupForPrecedence(this.second.toRegex(), Precedence.SEQ);
        return {
            regex: `${a.regex}${b.regex}`,
            precedence: Precedence.SEQ,
            captureGroupCount: a.captureGroupCount + b.captureGroupCount,
            captureNames: mergeMaps(a.captureNames, b.captureNames),
            captureGroups: mergeMaps(a.captureGroups, shiftCaptureGroups(b.captureGroups, a.captureGroupCount)),
            tags: mergeMaps(a.tags, b.tags),
        };
    }

    contentElement(): IPattern {
        return this;
    }
}

class RepPattern extends PatternBase {
    constructor(private element: IPattern, private min: number, private max?: number) { super(); }

    toRegex(): RegexResult {
        let e = groupForPrecedence(this.element.toRegex(), Precedence.REP);
        // Find the nicest operator for the bounds
        let op = (() => {
            if (this.max === undefined) {
                if (this.min == 0) return '*';
                if (this.min == 1) return '+';
                return `{${this.min},}`;
            }
            if (this.min == 0 && this.max == 1) return '?';
            if (this.min == this.max) return `{${this.min}}`;
            if (this.min == 0) return `{,${this.max}}`;
            return `{${this.min},${this.max}}`;
        })();
        return {
            ...e,
            regex: `${e.regex}${op}`,
            precedence: Precedence.REP,
        };
    }

    contentElement(): IPattern {
        return this;
    }
}

class CapturePattern extends PatternBase {
    constructor(private element: IPattern, private name: string) { super(); }

    toRegex(): RegexResult {
        let e = this.element.toRegex();
        return {
            regex: `(${e.regex})`,
            precedence: Precedence.GROUP,
            captureGroupCount: e.captureGroupCount + 1,
            captureGroups: extendMap(shiftCaptureGroups(e.captureGroups, 1), [this.contentElement(), 1]),
            captureNames: extendMap(e.captureNames, [this.name, this.contentElement()]),
            tags: e.tags,
        };
    }

    contentElement(): IPattern {
        return this.element.contentElement();
    }
}

class LookaroundPattern extends PatternBase {
    constructor(private element: IPattern, private behind: boolean, private negate: boolean) { super(); }

    toRegex(): RegexResult {
        let e = this.element.toRegex();
        let op = `${this.behind ? '<' : ''}${this.negate ? '!' : '='}`;
        return {
            ...e,
            precedence: Precedence.GROUP,
            regex: `(?${op}${e.regex})`,
        };
    }

    contentElement(): IPattern {
        return this.element.contentElement();
    }
}

class TagPattern extends PatternBase {
    constructor(private element: IPattern, private tags: any[]) { super(); }

    toRegex(): RegexResult {
        if (!(this.element instanceof CapturePattern)) throw new Error('Tagging requires an underlying capture');

        let e = this.element.toRegex();
        return {
            ...e,
            tags: extendMap(e.tags, [this.contentElement(), this.tags]),
        };
    }

    contentElement(): IPattern {
        return this.element.contentElement();
    }
}

/**
 * Groups the regex, if the specified precedence is higher, than the one of the regex.
 * @param regex The regex to group.
 * @param prec The precedence to group for.
 */
function groupForPrecedence(regex: RegexResult, prec: number): RegexResult {
    if (regex.precedence >= prec) return regex;
    return {
        ...regex,
        regex: `(?:${regex.regex})`,
        precedence: Precedence.GROUP,
    };
}

/**
 * Regex precedences.
 */
export namespace Precedence {
    export const LOWEST = 0;
    export const ALT = 0;
    export const SEQ = 1;
    export const REP = 2;
    export const GROUP = 3;
}

/**
 * Escapes a string so when it's used as a regular expression, it literally matches the text.
 * @param text The text to escape.
 * @returns The escaped text, so it can be used in a regex.
 */
function escapeRegex(text: string) {
    // Source: https://stackoverflow.com/a/6969486
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Statistics of a regex.
 */
type RegexStats = {
    /**
     * The precedence level.
     */
    precedence: number;

    /**
     * The number of capture groups.
     */
    captureGroupCount: number;
};

/**
 * Computes the statistics of a regex.
 * @param regex The regex to compute the stats for.
 * @returns The statistics for the regex.
 */
export function regexStats(regex: string): RegexStats {
    // Tracked precedence
    var prec = Precedence.GROUP;
    // Number of capture groups
    var captGroups = 0;
    // Pairwise parenthesis stack
    let stk: string[] = [];
    // Character pointer
    var i = 0;

    function updatePrec(p: number) {
        // We only care, if we are not in a grouping construct
        // which is signaled by an empty stack
        if (stk.length == 0) prec = Math.min(prec, p);
    }

    function possibleSequencing() {
        // If this wasn't the first character, we had sequencing
        if (i > 0) updatePrec(Precedence.SEQ);
    }

    function charAt(i: number): string | undefined {
        if (i < regex.length) return regex[i];
        return undefined;
    }

    function top(): string | undefined {
        if (stk.length == 0) return undefined;
        return stk[stk.length - 1];
    }

    function tryPop(ch: string): boolean {
        if (top() != ch) return false;
        stk.pop();
        return true;
    }

    while (i < regex.length) {
        // Grouping
        // It's only grouping, if we are not in a character class currently
        if (regex[i] == '(' && top() != ']') {
            possibleSequencing();
            // Skip character
            ++i;
            // We need a closing paren later
            stk.push(')');
            // Check, if there is a '?', signaling a special grouping construct
            // Special constructs are not captured (except named groups, but those are invalid in TextMate)
            if (charAt(i) == '?') ++i;
            else ++captGroups;
            continue;
        }
        // Character class
        if (regex[i] == '[') {
            possibleSequencing();
            // Skip character
            ++i;
            // We need a closing bracket later
            stk.push(']');
            // Special case, the first character sequence can be a ] or ^] without it closing the bracket
            if (charAt(i) == ']') ++i;
            else if (charAt(i) == '^' && charAt(i + 1) == ']') i += 2;
            continue;
        }
        // Closing constructs, ')' and `]`
        if (tryPop(regex[i])) {
            ++i;
            continue;
        }
        // Alternation
        if (regex[i] == '|') {
            updatePrec(Precedence.ALT);
            ++i;
            continue;
        }
        // Escaped character
        if (regex[i] == '\\') {
            possibleSequencing();
            i += 2;
            continue;
        }
        // Repetition
        if (i > 0 && "*+?{".indexOf(regex[i]) != -1) {
            updatePrec(Precedence.REP);
            if (regex[i] == '{') {
                // Walk to the '}'
                ++i;
                while (i < regex.length && regex[i] != '}') ++i;
            }
            else {
                ++i;
            }
            continue;
        }
        // Assume raw construct
        possibleSequencing();
        ++i;
    }

    return {
        precedence: prec,
        captureGroupCount: captGroups,
    }
}

// Utilities for manipulating maps

function mergeMaps<K, V>(m1: Map<K, V>, m2: Map<K, V>): Map<K, V> {
    let result = new Map();
    for (let [k, v] of m1) result.set(k, v);
    for (let [k, v] of m2) result.set(k, v);
    return result;
}

function extendMap<K, V>(m: Map<K, V>, ...vs: [K, V][]): Map<K, V> {
    return mergeMaps(m, new Map(vs));
}

function shiftCaptureGroups(m: Map<IPattern, number>, offset: number): Map<IPattern, number> {
    let result = new Map();
    for (let [k, v] of m) result.set(k, v + offset);
    return result;
}
