import { IPattern } from './pattern';

/**
 * Constructs a scope object for tagging.
 * @param name The name of the scope.
 * @returns The constructed scope tag.
 */
export function scope(name: string): object {
    return new ScopeTag(name);
}

/**
 * Constructs an include mode for the grammar.
 * @param name The name of the mode to reference.
 * @returns The constructed include mode.
 */
export function include(name: string): Mode {
    return { include: name };
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
    repository?: Map<string, Mode>;
};

/**
 * The different highlight modes.
 */
export type Mode =
    // Match mode
    | { scope: string; match: IPattern; captures?: Map<string, string>; }
    // Surround mode
    | { scope?: string; begin: IPattern; end: IPattern; beginCaptures?: Map<string, string>; endCaptures?: Map<string, string>; contains?: Mode[]; }
    // Sub-repository mode
    | { contains: Mode[]; }
    // Reference mode
    | { include: string; }
    ;

/**
 * Converts the given TextMate grammar into a JSON object.
 * @param g The TextMate grammar to convert.
 * @returns The converted JSON grammar.
 */
export function toTextMate(g: TextMateGrammar): object {
    // Fill in scope name
    if (!g.scopeName) g.scopeName = toKebabCase(g.name);

    let repo: any = undefined;
    if (g.repository) {
        repo = {};
        for (let [name, mode] of g.repository) repo[name] = modeToTextMate(mode, g);
    }

    return {
        '$schema': 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
        name: g.name,
        scopeName: g.scopeName,
        patterns: g.modes.map(m => modeToTextMate(m, g)),
        repository: repo,
    };
}

function modeToTextMate(m: Mode, g: TextMateGrammar): object {
    // Simple includes are a 1-to-1 mapping
    if ('include' in m) return m;

    let result: any = {};
    let mObj = m as any;

    function handlePattern(patternName: string, capturesName: string) {
        if (!mObj[patternName]) return;
        let { regex, captures } = compilePattern(mObj[patternName], mObj[capturesName], g);
        result[patternName] = regex;
        result[capturesName] = captures;
    }

    if (mObj.scope) result.scope = fixScope(mObj.scope, g);

    handlePattern('match', 'captures');
    handlePattern('begin', 'beginCaptures');
    handlePattern('end', 'endCaptures');

    // Containment
    if (mObj.contains) {
        let contained = mObj.contains as Mode[];
        result.patterns = contained.map(m => modeToTextMate(m, g));
    }

    return result;
}

function compilePattern(p: IPattern, existingCaptures: any, g: TextMateGrammar): { regex: string; captures: any; } {
    let result = p.toRegex();
    let captures: any = {};

    // TODO: Handle captures

    return {
        regex: result.regex,
        captures: captures,
    }
}

function fixScope(scope: string, g: TextMateGrammar): string {
    if (scope.endsWith(g.scopeName as string)) return scope;
    return `${scope}.${g.scopeName}`;
}

class ScopeTag { constructor(public name: string) { } }

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
