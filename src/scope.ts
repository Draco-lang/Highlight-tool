
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
     * Comment tags, like '@param' or 'FIXME'.
     */
    public static readonly CommentTag = new Scope('storage.type.comment-tag');

    /**
     * Comment tag authors, like TODO(LPeter1997).
     */
    public static readonly CommentTagAuthor = new Scope('storage.type.comment-tag.authot');

    /**
     * Punctuation of comments, like '//' or '/*'.
     */
    public static readonly CommentPunctuation = new Scope('punctuation.definition.comment');

    /**
     * Generic keyword category.
     */
    public static readonly Keyword = new Scope('keyword.other');

    /**
     * Annotation.
     */
    public static readonly Annotation = new Scope('storage.type.annotation');

    /**
     * Package name.
     */
    public static readonly PackageName = new Scope('entity.name.type.package');

    /**
     * Class name.
     */
    public static readonly ClassName = new Scope('entity.name.type.class');

    /**
     * Namespace name.
     */
    public static readonly NamespaceName = new Scope('entity.name.type.namespace');

    /**
     * '{'.
     */
    public static readonly CurlyBraceOpen = new Scope('punctuation.curlybrace.open');

    /**
     * '}'.
     */
    public static readonly CurlyBraceClose = new Scope('punctuation.curlybrace.close');

    /**
     * ';'.
     */
     public static readonly Semicolon = new Scope('punctuation.semicolon');

    /**
     * Modifier, like 'private' or 'final'.
     */
    public static readonly StorageModifier = new Scope('storage.modifier');

    ///////////////////////////////////////////////////////////////////////////

    constructor(
        public readonly textMateName: string,
    ) { }
}
