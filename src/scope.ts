
/**
 * The possible scopes for a syntax highlighter.
 */
export enum Scope {
    /**
     * Single-line comments.
     */
    LineComment,

    /**
     * Block comments.
     */
    BlockComment,

    /**
     * Documentation comments.
     */
    DocComment,

    /**
     * Documentation tags, like '@param' or 'FIXME'.
     */
    DocTag,
}
