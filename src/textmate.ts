import { IPattern } from './pattern';
import { Scope } from './scope';

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
    | { scope: Scope; match: IPattern; captures?: Map<string, string>; contains?: Mode[]; }
    // Surround mode
    | { scope?: Scope; begin: IPattern; end: IPattern; beginCaptures?: Map<string, string>; endCaptures?: Map<string, string>; contains?: Mode[]; }
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
    if (g.scopeName === undefined) g.scopeName = toKebabCase(g.name);

    let repo: any = undefined;
    if (g.repository !== undefined) {
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
    let mObj = m as any;

    // Simple includes are a 1-to-1 mapping
    if (mObj.include !== undefined) return mObj;

    // Build up the result from parts
    let result: any = {};

    function handlePattern(patternName: string, capturesName: string) {
        if (mObj[patternName] === undefined) return;
        let { regex, captures } = compilePattern(mObj[patternName], mObj[capturesName], g);
        result[patternName] = regex;
        result[capturesName] = captures;
    }

    if (mObj.scope !== undefined) result.scope = fixScope(mObj.scope, g);

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

function compilePattern(p: IPattern, existingCaptures: any, g: TextMateGrammar): { regex: string; captures: any; } {
    let result = p.toRegex();
    let captures: any = {};

    // TODO: Handle captures

    return {
        regex: result.regex,
        captures: Object.keys(captures).length == 0
            ? undefined
            : captures,
    }
}

function fixScope(scope: Scope, g: TextMateGrammar): string {
    let scopeStr = scopeToTextMate(scope);
    return `${scopeStr}.${g.scopeName}`;
}

function scopeToTextMate(s: Scope): string {
    switch (s) {
    case Scope.BlockComment: return "comment.block";
    case Scope.LineComment: return "comment.line";
    case Scope.DocComment: return "comment.block.documentation";
    case Scope.DocTag: return "comment.block.documentation";

    default: return '???';
    }
}

class ScopeTag { constructor(public scope: Scope) { } }

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
