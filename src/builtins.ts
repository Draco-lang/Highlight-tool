import { regex, literal, cat, or, rep0, rep1, IPattern } from './pattern';

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
    literal(':')
);

/**
 * Creates a sequence of alternative keywords that are separated by word boundaries.
 * @param kws The possible keywords.
 * @returns The created pattern.
 */
export const KEYWORD = (...kws: string[]) =>
    cat(WORD_BOUNDARY,
        or(...kws.map(literal)),
        WORD_BOUNDARY);
