import { TextMateGrammar, toTextMate, include } from "./textmate";
import { or, regex, literal, rep0, rep1, opt, cat, capture, tag, lookahead, lookbehind } from './pattern';
import { Scope } from './scope';
import { IDENT, SPACE, COMMENT_TAGS, keyword } from './builtins';

const QUALIFIED_NAME = cat(
    IDENT,
    rep0(cat(
        rep0(SPACE),
        literal('.'),
        rep0(SPACE),
        IDENT)));

const QUALIFIED_NAME_WITH_WILDCARD = cat(
    QUALIFIED_NAME,
    opt(cat(
        literal('.'),
        rep0(SPACE),
        literal('*'))));

const ENTITY_PREFIX = keyword('private', 'final');
const ENTITY_CATEGORY = keyword('entity', 'contract');

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
                begin: literal('//').tag(Scope.CommentPunctuation),
                end: lookahead(regex('$')),
                contains: [include('comment-tags')],
            },
            {
                scope: Scope.BlockComment,
                begin: literal('/*').tag(Scope.CommentPunctuation),
                end: literal('*/').tag(Scope.CommentPunctuation),
                contains: [include('comment-tags')],
            }
        ],
        'comment-tags': {
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
                {
                    begin: literal('{').tag(Scope.CurlyBraceOpen),
                    end: literal('}').tag(Scope.CurlyBraceClose),
                    contains: [
                        include('import-statement'),
                        include('package-element'),
                        include('comment'),
                    ]
                },
                include('comment'),
            ]
        },
        'import-statement': {
            match: cat(
                literal('import').tag(Scope.Keyword),
                rep1(SPACE),
                QUALIFIED_NAME_WITH_WILDCARD.tag(Scope.PackageName),
            ),
            contains: [include('comment')],
        },
        'package-element': [
            include('package-block'),
            include('model-element'),
        ],
        'model-element': [
            include('annotation'),
            include('entity-definition'),
            include('operation-definition'),
            {
                scope: Scope.StorageModifier,
                match: ENTITY_PREFIX,
            },
        ],
        'entity-definition': {
            begin: lookahead(ENTITY_CATEGORY),
            end: lookbehind(literal('{')),
            contains: [
                {
                    begin: cat(
                        ENTITY_CATEGORY.tag(Scope.Keyword),
                        rep1(SPACE),
                        IDENT.tag(Scope.ClassName)),
                    end: lookahead(literal('{')),
                    contains: [
                        // TODO: Base-type(s)
                        include('comment'),
                    ]
                },
                {
                    begin: literal('{').tag(Scope.CurlyBraceOpen),
                    end: literal('}').tag(Scope.CurlyBraceClose),
                    contains: [
                        include('operation-definition'),
                        include('slot-definition'),
                        include('slot-omission'),
                        include('slot-value-assignment'),
                        include('comment'),
                    ]
                },
                {
                    match: literal(';').tag(Scope.Semicolon),
                },
                include('comment'),
            ],
        },
        'annotation': [
            include('flag-annotation'),
            include('constraint-annotation'),
        ],
        'flag-annotation': {
            scope: Scope.Annotation,
            match: cat(literal('@'), rep0(SPACE), QUALIFIED_NAME),
            contains: [include('comment')],
        }
    },
};
let tm = toTextMate(dmla);

console.log(JSON.stringify(tm, undefined, 2));
