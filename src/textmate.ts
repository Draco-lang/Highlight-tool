import { IPattern, Precedence, regexStats, regex } from './pattern';
import { Scope } from './scope';

/**
 * Constructs an include mode for the grammar.
 * @param name The name of the mode to reference.
 * @returns The constructed include mode.
 */
export function include(name: string): Mode {
    return { include: `#${name}` };
}

/**
 * The type of a TextMate grammar.
 */
export type TextMateGrammar = {
    /**
     * The name of the language.
     */
    name: string;

    /**
     * The language scope name.
     */
    scopeName?: string;

    /**
     * The valid extensions to the language without the dot.
     */
    extensions: string[];

    /**
     * The top-level modes of the language.
     */
    modes: Mode[];

    /**
     * The mode repository.
     */
    repository?: Record<string, Mode | Mode[]>;
};

/**
 * The different highlight modes.
 */
export type Mode =
    // Match mode
    | { scope?: Scope; match: IPattern; captures?: Record<string, CaptureValue>; contains?: Mode[]; }
    // Surround mode
    | { scope?: Scope; begin: IPattern; end: IPattern; beginCaptures?: Record<string, CaptureValue>; endCaptures?: Record<string, CaptureValue>; contains?: Mode[]; }
    // Sub-repository mode
    | { contains: Mode[]; }
    // Reference mode
    | { include: string; }
    ;

type CaptureValue = Mode | Scope;

/**
 * Converts the given TextMate grammar into a JSON object.
 * @param g The TextMate grammar to convert.
 * @returns The converted JSON grammar.
 */
export function toTextMate(g: TextMateGrammar): object {
    // Fill in scope name
    if (g.scopeName === undefined) g.scopeName = toKebabCase(g.name);

    let repo: any = undefined;
    if (g.repository !== undefined) {
        repo = {};
        for (let name in g.repository) repo[name] = modeToTextMate(g.repository[name], g);
    }

    return {
        '$schema': 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
        name: g.name,
        scopeName: `source.${g.scopeName}`,
        fileTypes: g.extensions,
        patterns: g.modes.map(m => modeToTextMate(m, g)),
        repository: repo,
    };
}

function modeToTextMate(m: Mode | Mode[], g: TextMateGrammar): object {
    // Arrays are groupings of other modes, just wrap it up
    if (Array.isArray(m)) return modeToTextMate({ contains: m as Mode[] }, g);

    let mObj = m as any;

    // Simple includes are a 1-to-1 mapping
    if (mObj.include !== undefined) return mObj;

    // Build up the result from parts
    let result: any = {};

    function handlePattern(patternName: string, capturesName: string) {
        if (mObj[patternName] === undefined) return;
        let { regex, captures } = compilePattern(mObj[patternName], g, mObj[capturesName]);
        result[patternName] = regex;
        result[capturesName] = captures;
    }

    if (mObj.scope !== undefined) result.name = fixScope(mObj.scope, g);

    handlePattern('match', 'captures');
    handlePattern('begin', 'beginCaptures');
    handlePattern('end', 'endCaptures');

    // Containment
    if (mObj.contains !== undefined) {
        let contained = mObj.contains as Mode[];
        result.patterns = contained.map(m => modeToTextMate(m, g));
    }

    return result;
}

type RegexWithCaptures = { regex: string; captures: any; };

function compilePattern(p: IPattern, g: TextMateGrammar, existingCaptures?: Record<string, CaptureValue>): RegexWithCaptures {
    let result = p.toRegex();
    let captures: any = {};

    function translateGroupName(groupName: string): string {
        // Special case
        if (groupName == '$all') return '0';

        // Find the corresponding pattern
        let pattern = result.captureNames.get(groupName);
        if (pattern === undefined) throw new Error(`Unknown capture group '${groupName}' referenced`);

        // Find the corresponding index
        let groupIndex = result.captureGroups.get(pattern);
        if (groupIndex === undefined) throw new Error(`Internal error, group ${groupName} has no index entry`);

        return groupIndex.toString();
    }

    // Look into the existing captures and translate them to numbers
    if (existingCaptures !== undefined) {
        for (let groupName in existingCaptures) {
            let groupValue = existingCaptures[groupName];
            // Translate capture group name into numbering
            var newGroupName = translateGroupName(groupName);
            // Assign into result
            if (groupValue instanceof Scope) {
                // Scope, wrap it up
                captures[newGroupName] = { name: fixScope(groupValue, g) };
            }
            else {
                // Treat as object
                captures[newGroupName] = modeToTextMate(groupValue, g);
            }
        }
    }

    // Look into each pattern with tags
    for (let [pattern, tags] of result.tags) {
        // Look through each tag
        for (let tag of tags) {
            // Look up the group index of the pattern
            let groupIndex = result.captureGroups.get(pattern);
            if (groupIndex === undefined) throw new Error(`Internal error, group has no index entry for tag ${tag}`);

            // We only care about scopes
            if (tag instanceof Scope) {
                // Scope, wrap it up
                captures[groupIndex.toString()] = { name: fixScope(tag, g) };
            }
            else {
                // TODO: Handle other tags
            }
        }
    }

    return optimizeRegexWithCaptures({
        regex: result.regex,
        captures: Object.keys(captures).length == 0
            ? undefined
            : captures,
    });
}

function optimizeRegexWithCaptures(r: RegexWithCaptures): RegexWithCaptures {
    let stats = regexStats(r.regex);
    if (stats.captureGroupCount >= 1
     && stats.precedence >= Precedence.GROUP
     && '1' in r.captures
     && r.regex.startsWith('(')
     && r.regex.endsWith(')')) {
        // Common pattern, it's essentially
        // match: (...)
        // captures: { "1": ... }
        //
        // Simplify to
        // match: ...
        // captures: { "0": ... }
        //
        // And shift the other groups alongside!
        let captures: any = {};
        for (let idx in r.captures) captures[(parseInt(idx) - 1).toString()] = r.captures[idx];
        r = {
            regex: r.regex.substring(1,  r.regex.length - 1),
            captures: captures,
        };
    }
    return r;
}

function fixScope(scope: Scope, g: TextMateGrammar): string {
    return `${scope.textMateName}.${g.scopeName}`;
}

/**
 * Converts a string to kebab-case.
 * @param text The text to convert.
 * @returns The text in kebab case.
 */
function toKebabCase(text: string): string {
    return text
        .toLowerCase()
        .replace(/ /g, '-');
}
