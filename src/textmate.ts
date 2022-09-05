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
     * The top-level patterns of the language.
     */
    patterns: Mode[];

    /**
     * The pattern repository.
     */
    repository?: object;
};

/**
 * The different highlight modes.
 */
export type Mode =
    // Match mode
    | { scope: string; match: IPattern; captures: Map<string, string>; }
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

    return {
        '$schema': 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
        name: g.name,
        scopeName: g.scopeName,
    };
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
