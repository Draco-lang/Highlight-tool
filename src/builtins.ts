import { IPattern, regex, literal, cat, or, rep0, rep1, opt } from './pattern';
import { Scope } from './scope';

/**
 * Represents a word boundary.
 */
export const WORD_BOUNDARY = regex('\\b');

/**
 * Represents any space character.
 */
export const SPACE = regex('\\s');

/**
 * An identifier pattern that can start with letters or '_' and continue with
 * alphanumeric characters or '_'.
 */
export const IDENT = regex('[_[:alpha:]][_[:alnum:]]*');

/**
 * Common tags in comments.
 */
export const COMMENT_TAGS = cat(
    WORD_BOUNDARY,
    or(
        literal('TODO'),
        literal('FIXME'),
        literal('NOTE'),
        literal('BUG'),
        literal('OPTIMIZE'),
        literal('HACK'),
        literal('XXX')),
    // Optionally, allow the user tag in parens after, like TODO(LPeter1997)
    opt(cat(
        literal('('),
        rep1(regex('[^(]')).tag(Scope.CommentTagAuthor),
        literal(')')
    )),
    // Colon required
    literal(':')
).tag(Scope.CommentTag);

/**
 * Creates a sequence of alternative keywords that are separated by word boundaries.
 * @param kws The possible keywords.
 * @returns The created pattern.
 */
export const keyword = (...kws: string[]) =>
    cat(WORD_BOUNDARY,
        or(...kws.map(literal)),
        WORD_BOUNDARY);
