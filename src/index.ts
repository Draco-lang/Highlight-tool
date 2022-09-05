import { TextMateGrammar, toTextMate } from "./textmate";

let draco: TextMateGrammar = {
    name: 'Draco',
    extensions: ['draco'],
    patterns: [],
    repository: {},
};
let tm = toTextMate(draco);

console.log(JSON.stringify(tm, undefined, 2));
