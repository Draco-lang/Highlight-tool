import { TextMateGrammar, toTextMate, include } from "./textmate";
import { or, regex, literal } from './pattern';
import { Scope } from './scope';

let draco: TextMateGrammar = {
    name: 'Draco',
    extensions: ['draco'],
    modes: [
        include('comment'),
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
    ]),
};
let tm = toTextMate(draco);

console.log(JSON.stringify(tm, undefined, 2));
