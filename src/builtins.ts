import { IPattern, regex, literal, cat, or, rep0, rep1, opt } from './pattern';
import { Scope, Scopes } from './scope';

/**
 * Represents a word boundary.
 */
export const WordBoundary = regex('\\b');

/**
 * Represents any space character.
 */
export const Space = regex('\\s');

/**
 * An identifier pattern that can start with letters or '_' and continue with
 * alphanumeric characters or '_'.
 */
export const Ident = regex('[_[:alpha:]][_[:alnum:]]*');

/**
 * Common tags in comments.
 */
export const CommentTag = cat(
    WordBoundary,
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
        rep1(regex('[^(]')).tag(Scopes.Comment.TagAuthor),
        literal(')')
    )),
    // Colon required
    literal(':')
).tag(Scopes.Comment.Tag);

/**
 * Creates a sequence of alternative keywords that are separated by word boundaries.
 * @param kws The possible keywords.
 * @returns The created pattern.
 */
export const keyword = (...kws: string[]) =>
    cat(WordBoundary,
        or(...kws.map(literal)),
        WordBoundary);
