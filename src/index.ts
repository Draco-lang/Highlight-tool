import { TextMateGrammar, toTextMate, include } from "./textmate";
import { or, regex, literal, rep0, rep1, opt, cat, capture, tag, lookahead, lookbehind } from './pattern';
import { Scope, Scopes } from './scope';
import { IDENT, SPACE, COMMENT_TAGS, keyword } from './builtins';

const QUALIFIED_NAME = cat(
    IDENT,
    rep0(
        rep0(SPACE),
        literal('.'),
        rep0(SPACE),
        IDENT));

const QUALIFIED_NAME_WITH_WILDCARD = cat(
    QUALIFIED_NAME,
    opt(
        literal('.'),
        rep0(SPACE),
        literal('*')));

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
                scope: Scopes.Comment.line('//'),
                begin: literal('//').tag(Scopes.Comment.Punct),
                end: lookahead(regex('$')),
                contains: [include('comment-tags')],
            },
            {
                scope: Scopes.Comment.Block,
                begin: literal('/*').tag(Scopes.Comment.Punct),
                end: literal('*/').tag(Scopes.Comment.Punct),
                contains: [include('comment-tags')],
            }
        ],
        'comment-tags': COMMENT_TAGS,
        'package-block': {
            begin: lookahead(keyword('package')),
            end: lookbehind(literal('}')),
            contains: [
                {
                    begin: cat(
                        keyword('package').tag(Scopes.Keyword.Package),
                        rep1(SPACE),
                        QUALIFIED_NAME.tag(Scopes.Name.Package)),
                    end: lookahead(literal('{')),
                    contains: [include('comment')],
                },
                {
                    begin: literal('{').tag(Scopes.punct('{')),
                    end: literal('}').tag(Scopes.punct('}')),
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
                literal('import').tag(Scopes.Keyword.Import),
                rep1(SPACE),
                QUALIFIED_NAME_WITH_WILDCARD.tag(Scopes.Name.Package),
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
            ENTITY_PREFIX.tag(Scopes.modifier()),
        ],
        'entity-definition': {
            begin: lookahead(ENTITY_CATEGORY),
            end: lookbehind(literal('}')),
            contains: [
                {
                    begin: cat(
                        ENTITY_CATEGORY.tag(Scopes.Keyword.Class),
                        rep1(SPACE),
                        IDENT.tag(Scopes.Name.Class)),
                    end: lookahead(literal('{')),
                    contains: [
                        // TODO: Base-type(s)
                        include('comment'),
                    ]
                },
                {
                    begin: literal('{').tag(Scopes.punct('{')),
                    end: literal('}').tag(Scopes.punct('}')),
                    contains: [
                        include('operation-definition'),
                        include('slot-definition'),
                        include('slot-omission'),
                        include('slot-value-assignment'),
                        include('comment'),
                    ]
                },
                literal(';').tag(Scopes.punct(';')),
                include('comment'),
            ],
        },
        'annotation': [
            include('flag-annotation'),
            include('constraint-annotation'),
        ],
        'flag-annotation': {
            scope: Scopes.Name.Attribute,
            match: cat(literal('@'), rep0(SPACE), QUALIFIED_NAME),
            contains: [include('comment')],
        }
    },
};
let tm = toTextMate(dmla);

console.log(JSON.stringify(tm, undefined, 2));
