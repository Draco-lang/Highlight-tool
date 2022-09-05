import { TextMateGrammar, toTextMate, include } from "./textmate";
import { or, regex, literal, rep0, rep1, cat, capture, tag, lookahead, lookbehind } from './pattern';
import { Scope } from './scope';
import { IDENT, SPACE, COMMENT_TAGS, KEYWORD as keyword, KEYWORD } from './builtins';

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
    repository: {
        comment: [
            {
                scope: Scope.LineComment,
                begin: literal('//'),
                end: lookahead(regex('$')),
                beginCaptures: {
                    '$all': Scope.CommentPunctuation,
                },
                contains: [include('comment-tags')],
            },
            {
                scope: Scope.BlockComment,
                begin: literal('/*'),
                end: literal('*/'),
                beginCaptures: {
                    '$all': Scope.CommentPunctuation,
                },
                endCaptures: {
                    '$all': Scope.CommentPunctuation,
                },
                contains: [include('comment-tags')],
            }
        ],
        'comment-tags': {
            scope: Scope.DocTag,
            match: COMMENT_TAGS,
        },
        'package-block': {
            begin: lookahead(keyword('package')),
            end: lookbehind(literal('}')),
            contains: [
                {
                    begin: cat(
                        keyword('package').tag(Scope.Keyword),
                        rep1(SPACE),
                        QUALIFIED_NAME.tag(Scope.PackageName)),
                    end: lookahead(literal('{')),
                    contains: [include('comment')],
                },
                include('comment'),
            ]
        }
    },
};
let tm = toTextMate(dmla);

console.log(JSON.stringify(tm, undefined, 2));
