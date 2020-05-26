//import keywing = require('keywing');
import * as keywing from 'keywing';
import {
    StoreMemory,
    ValidatorKw1,
    Keypair,
} from 'keywing';

let kw = new StoreMemory([ValidatorKw1], 'ws');
let keypair : Keypair = keywing.generateKeypair();
let author = keywing.addSigilToKey(keypair.public);

kw.set({
    format: 'kw.1',
    key: 'key1',
    value: 'keywing is working',
    author: author,
    authorSecret: keypair.secret,
});

console.log(kw.getValue('key1'));
