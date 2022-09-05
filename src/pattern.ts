
/**
 * Represents a pattern that can be translated to a regular expression.
 */
interface IPattern {
    /**
     * Translates this pattern to a regular expression.
     */
    toRegex(): RegexResult;
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
     * The named capture groups mapped from name to the corresponding pattern.
     */
    captureNames: Map<string, IPattern>;

    /**
     * The total number of capture groups, including the unnamed ones.
     */
    captureGroupCount: number;

    /**
     * The capture groups mapped from the pattern to the group number.
     */
    captureGroups: Map<IPattern, number>;
};

/**
 * Regex precedences.
 */
namespace Precedence {
    export const LOWEST = 0;
    export const ALT = 0;
    export const SEQ = 1;
    export const REPEAT = 2;
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
            updatePrec(Precedence.REPEAT);
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
