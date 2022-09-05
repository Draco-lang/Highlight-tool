import { TextMateGrammar, toTextMate, include } from "./textmate";
import { or, regex, literal, rep0, rep1, cat, capture } from './pattern';
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

let draco: TextMateGrammar = {
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
                capture(literal('package'), 'keyword'),
                rep1(SPACE),
                capture(QUALIFIED_NAME, 'package-name')),
            end: literal('}'),
            beginCaptures: new Map([
                ['keyword', Scope.Keyword],
                ['package-name', Scope.PackageName],
            ]),
        }],
    ]),
};
let tm = toTextMate(draco);

console.log(JSON.stringify(tm, undefined, 2));
