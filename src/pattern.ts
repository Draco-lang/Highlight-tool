
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
 * Shorthand for @see rep(p, 0, undefined).
 */
export function rep0(p: IPattern): IPattern {
    return rep(p, 0, undefined);
}

/**
 * Shorthand for @see rep(p, 1, undefined).
 */
export function rep1(p: IPattern): IPattern {
    return rep(p, 1, undefined);
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
 * Tags a pattern with metadata.
 * @param p The pattern to tag.
 * @param tags The tag values.
 * @returns The tagged pattern.
 */
export function tag(p: IPattern, ...tags: object[]): IPattern {
    return new TagPattern(p, tags);
}

/**
 * Represents a pattern that can be translated to a regular expression.
 */
interface IPattern {
    /**
     * Translates this pattern to a regular expression.
     */
    toRegex(): RegexResult;

    /**
     * Retrieves the underlying pattern, in case this is a metadata element with no
     * contrinution to the regex output.
     */
    contentElement(): IPattern;
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
     * The tags mapped from the pattern to the list of assigned tags.
     */
    tags: Map<IPattern, object[]>;
};

class RegexPattern implements IPattern {
    constructor(private text: string) { }

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

class AltPattern implements IPattern {
    constructor(private first: IPattern, private second: IPattern) { }

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

class SeqPattern implements IPattern {
    constructor(private first: IPattern, private second: IPattern) { }

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

class RepPattern implements IPattern {
    constructor(private element: IPattern, private min: number, private max?: number) { }

    toRegex(): RegexResult {
        let e = groupForPrecedence(this.element.toRegex(), Precedence.REP);
        // Find the nicest operator for the bounds
        let op = (() => {
            if (!this.max) {
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

class CapturePattern implements IPattern {
    constructor(private element: IPattern, private name: string) { }

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

class TagPattern implements IPattern {
    constructor(private element: IPattern, private tags: object[]) { }

    toRegex(): RegexResult {
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
namespace Precedence {
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

    function tryPop(ch: string): boolean {
        if (stk.length > 0 && stk[stk.length - 1] == ch) {
            stk.pop();
            return true;
        }
        return false;
    }

    while (i < regex.length) {
        // Grouping
        if (regex[i] == '(') {
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
