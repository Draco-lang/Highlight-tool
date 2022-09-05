import * as p from './pattern';

const WORD_BOUNDARY = p.regex('\\b');
const SPACE = p.regex('\\s');
const C_IDENT = p.cat(p.regex('[_[:alpha:]]'), p.rep0(p.regex('[_[:alnum:]]')));
const KEYWORD = (...kws: string[]) => p.cat(WORD_BOUNDARY, p.or(...kws.map(p.literal)), WORD_BOUNDARY);

const QUALIFIED_NAME = p.cat(
    C_IDENT,
    p.rep0(p.cat(
        p.rep0(SPACE),
        p.literal('.'),
        p.rep0(SPACE),
        C_IDENT
    )),
);

const PACAGE_BLOCK_BEGIN = p.cat(
    p.capture(KEYWORD('package'), 'keyword'),
    p.rep1(SPACE),
    p.capture(QUALIFIED_NAME, 'name'));

console.log(PACAGE_BLOCK_BEGIN.toRegex());
