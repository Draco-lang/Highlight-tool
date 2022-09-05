import { TextMateGrammar, toTextMate, include } from "./textmate";
import { regex } from './pattern';

let draco: TextMateGrammar = {
    name: 'Draco',
    extensions: ['draco'],
    modes: [
        include('comment'),
    ],
    repository: new Map([
        ['comment', {
            scope: 'documentation.comment',
            match: regex('//.*$'),
        }],
    ]),
};
let tm = toTextMate(draco);

console.log(JSON.stringify(tm, undefined, 2));
