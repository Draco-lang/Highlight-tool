import { TextMateGrammar, toTextMate, include } from "./textmate";
import { or, regex, literal, rep0, rep1, cat, capture, tag } from './pattern';
import { Scope } from './scope';

const IDENT = regex('[_[:alpha:]][_[:alnum:]]*');
const SPACE = regex('\\s');
const QUALIFIED_NAME = cat(
    IDENT,
    rep0(cat(
        rep0(SPACE),
        literal('.'),
        rep0(SPACE),
        IDENT)));

let dmla: TextMateGrammar = {
    name: 'D#',
    scopeName: 'dsharp',
    extensions: ['dmla'],
    modes: [
        include('comment'),
        include('package-block'),
    ],
    repository: new Map([
        ['comment', {
            scope: Scope.LineComment,
            match: regex('//.*$'),
            contains: [
                {
                    scope: Scope.DocTag,
                    match: or(literal('TODO'), literal('FIXME')),
                }
            ],
        }],
        ['package-block', {
            begin: cat(
                tag(literal('package'), Scope.Keyword),
                rep1(SPACE),
                tag(QUALIFIED_NAME, Scope.PackageName)),
            end: literal('}'),
        }],
    ]),
};
let tm = toTextMate(dmla);

console.log(JSON.stringify(tm, undefined, 2));
