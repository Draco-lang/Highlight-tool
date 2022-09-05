
/**
 * Represents a scope that can be highlighted.
 */
export class Scope {
    /**
     * Single-line comments.
     */
    public static readonly LineComment = new Scope('comment.line');

    /**
     * Block comments.
     */
    public static readonly BlockComment = new Scope('comment.block');

    /**
     * Documentation comments.
     */
    public static readonly DocComment = new Scope('comment.block.documentation');

    /**
     * Documentation tags, like '@param' or 'FIXME'.
     */
    public static readonly DocTag = new Scope('storage.type.class.jsdoc');

    /**
     * Punctuation of comments, like '//' or '/*'.
     */
    public static readonly CommentPunctuation = new Scope('punctuation.definition.comment');

    /**
     * Generic keyword category.
     */
    public static readonly Keyword = new Scope('keyword.other');

    /**
     * Package name.
     */
    public static readonly PackageName = new Scope('entity.name.type.package');

    /**
     * Namespace name.
     */
     public static readonly NamespaceName = new Scope('entity.name.type.namespace');

    ///////////////////////////////////////////////////////////////////////////

    constructor(
        public readonly textMateName: string,
    ) { }
}
