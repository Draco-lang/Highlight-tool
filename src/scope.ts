
/**
 * Represents a scope that can be highlighted.
 */
export class Scope {
    public textMateName: string = 'undefined';

    constructor() { }

    public static create(): Scope {
        return new Scope();
    }

    public withTextMateName(tmName: string): Scope {
        this.textMateName = tmName;
        return this;
    }
}

/**
 * Predefined scopes.
 */
export namespace Scopes {
    /**
     * Scopes related to comments.
     */
    export namespace Comment {
        /**
         * Retrieves the scope most appropriate for the line comment with the given start symbol.
         * @param symbol The starting symbol of the line comment.
         * @returns The best scope for the line comment.
         */
        export function line(symbol?: string): Scope {
            switch (symbol) {
                case '//':
                    return Scope.create()
                        .withTextMateName('comment.line.double-slash');

                case '--':
                    return Scope.create()
                        .withTextMateName('comment.line.double-dash');

                case '#':
                    return Scope.create()
                        .withTextMateName('comment.line.number-sign');

                case '%':
                    return Scope.create()
                        .withTextMateName('comment.line.percentage');

                default:
                    return Scope.create()
                        .withTextMateName('comment.line');
            }
        }

        /**
         * Block comment.
         */
        export const Block = Scope.create()
            .withTextMateName('comment.block');

        /**
         * Documentation comment.
         */
        export const Doc = Scope.create()
            .withTextMateName('comment.block.documentation');

        /**
         * Comment tags, like '@param' or 'FIXME'.
         */
        export const Tag = Scope.create()
            .withTextMateName('storage.type.comment-tag');

        /**
         * Comment tag authors, like TODO(LPeter1997).
         */
        export const TagAuthor = Scope.create()
            .withTextMateName('storage.type.comment-tag.author');

        /**
         * Punctuation of comments, like '//' or '/*'.
         */
        export const Punct = Scope.create()
            .withTextMateName('punctuation.definition.comment');
    }

    /**
     * Common keywords.
     */
    export namespace Keyword {
        /**
         * Constructs a generic keyword scope.
         * @param name The name of the keyword.
         * @returns The constructed scope.
         */
        export function other(name?: string): Scope {
            return Scope.create().withTextMateName(`keyword.other.${name}`);
        }

        /**
         * Constructs a control keyword scope.
         * @param name The name of the keyword.
         * @returns The constructed scope.
         */
        export function control(name?: string): Scope {
            return Scope.create().withTextMateName(append('keyword.control', name));
        }

        /**
         * Constructs an operator keyword scope.
         * @param name The name of the operator.
         * @returns The constructed scope.
         */
        export function operator(name?: string): Scope {
            return Scope.create().withTextMateName(append('keyword.operator', name));
        }

        export const Package = other('package');
        export const Namespace = other('namespace');
        export const Class = other('class');
        export const Struct = other('struct');
        export const Using = other('using');
        export const Import = other('import');
        export const Static = other('static');

        export const If = control('conditional.if');
        export const Else = control('conditional.else');
        export const While = control('loop.while');
        export const For = control('loop.for');
        export const Continue = control('flow.continue');
        export const Break = control('flow.break');
        export const Return = control('flow.return');
        export const Goto = control('goto');
    }

    /**
     * Entity names.
     */
    export namespace Name {
        /**
         * Constructs a scope for type names.
         * @param name The name of the type.
         * @returns The constructed scope.
         */
        export function type(name?: string) {
            return Scope.create().withTextMateName(append('entity.name.type', name));
        }

        /**
         * Constructs a scope for some builtin value, like 'this', 'super' or 'self'.
         * @param name The buildin values name.
         * @returns The constructed scope.
         */
        export function builtin(name?: string) {
            return Scope.create().withTextMateName(append('variable.language', name));
        }

        export const Package = type('package');
        export const Namespace = type('namespace');
        export const Class = type('class');
        export const Struct = type('struct');

        export const This = builtin('this');
        export const Super = builtin('super');
        export const Self = builtin('self');

        export const Function = Scope.create()
            .withTextMateName('entity.name.function');
        export const Attribute = Scope.create()
            .withTextMateName('entity.other.attribute-name');
        export const Base = Scope.create()
            .withTextMateName('entity.other.inherited-class');
    }

    /**
     * Constructs a scope for modifiers like 'static', 'final', 'abstract', ...
     * @param name The name of the modifier.
     * @returns The constructed scope.
     */
    export function modifier(name?: string) {
        return Scope.create().withTextMateName(append('storage.modifier', name));
    }

    /**
     * Constructs a scope for punctuation.
     * @param char The punctuation character(s).
     * @returns The constructed scope.
     */
    export function punct(char?: string) {
        switch (char) {
            case '{':
                return Scope.create()
                    .withTextMateName('punctuation.curlybrace.open');

            case '}':
                return Scope.create()
                    .withTextMateName('punctuation.curlybrace.close');

            case '(':
                return Scope.create()
                    .withTextMateName('punctuation.parenthesis.open');

            case ')':
                return Scope.create()
                    .withTextMateName('punctuation.parenthesis.close');

            case '[':
                return Scope.create()
                    .withTextMateName('punctuation.squarebracket.open');

            case ']':
                return Scope.create()
                    .withTextMateName('punctuation.squarebracket.close');

            case ';':
                return Scope.create()
                    .withTextMateName('punctuation.semicolon');

            default:
                return Scope.create()
                    .withTextMateName('punctuation');
        }
    }

    /**
     * Literal values.
     */
    export namespace Literal {
        /**
         * Constructs a generic literal scope.
         * @param name The name of the literal.
         * @returns The constructed scope.
         */
        export function other(name?: string): Scope {
            return Scope.create().withTextMateName(append('constant.other', name));
        }

        /**
         * Creates a scope for numeric literals.
         * @param name The name of the numeric literal.
         * @returns The constructed scope.
         */
        export function numeric(name?: string) {
            return Scope.create().withTextMateName(append('constant.numeric', name));
        }

        /**
         * Creates a scope for keyword-like literals.
         * @param name The name of the literal.
         * @returns The constructed scope.
         */
        export function keyword(name?: string) {
            return Scope.create().withTextMateName(append('constant.language', name));
        }

        /**
         * Creates a scope for string literals.
         * @param punct The punctuation character that starts or ends the string.
         */
        export function string(punct?: string) {
            switch (punct) {
                case '\'':
                    return Scope.create()
                        .withTextMateName('string.quoted.single');

                case '"':
                    return Scope.create()
                        .withTextMateName('string.quoted.double');

                case '"""':
                    return Scope.create()
                        .withTextMateName('string.quoted.triple');

                default:
                    return Scope.create()
                        .withTextMateName('string.quoted.other');
            }
        }

        export const Char = Scope.create()
            .withTextMateName('constant.character');
        export const CharEscape = Scope.create()
            .withTextMateName('constant.character.escape');
        export const RegExp = Scope.create()
            .withTextMateName('string.regexp');
    }

    /**
     * Things related to markup.
     */
    export namespace Markup {
        export function heading(tag?: string): Scope {
            return Scope.create().withTextMateName(append('markup.heading', tag));
        }

        export function snippet(name?: string): Scope {
            return Scope.create().withTextMateName(append('markup.raw', name));
        }

        export const Link = Scope.create()
            .withTextMateName('markup.underline.link');

        export const Underline = Scope.create()
            .withTextMateName('markup.underline');
        export const Bold = Scope.create()
            .withTextMateName('markup.bold');
        export const Italic = Scope.create()
            .withTextMateName('markup.italic');

        export const List = Scope.create()
            .withTextMateName('markup.list');
        export const OrderedList = Scope.create()
            .withTextMateName('markup.list.numbered');
        export const UnorderedList = Scope.create()
            .withTextMateName('markup.list.unnumbered');

        export const Quote = Scope.create()
            .withTextMateName('markup.quote');
        export const Raw = Scope.create()
            .withTextMateName('markup.raw');
    }
}

function append(s1: string, s2?: string) {
    if (s2 === undefined) return s1;
    return `${s1}.${s2}`;
}
