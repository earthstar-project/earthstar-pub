import express = require('express');
import * as keywing from 'keywing';
import {
    StoreMemory,
    ValidatorKw1,
    IStore,
    Keypair,
    Item,
} from 'keywing';
import 'fs';
import { appendFile } from 'fs';

//================================================================================
// KEYWING SETUP

let workspace = 'test';
let kw = new StoreMemory([ValidatorKw1], workspace);
//let keypair : Keypair = keywing.generateKeypair();
let keypair : Keypair = {
    public: 'Ki6aDqWS5O5pQlmrQWv2kT97abIWCC0wqbMrwoqoZq0=',
    secret: 'VSdYKDZzl2A4Cm7AW5GGgGWv3MtNKszf7bOcvgW/LRo='
}
let author = keywing.addSigilToKey(keypair.public);

/*
kw.set({
    format: 'kw.1',
    key: 'wiki/kittens',
    value: 'Kittens are small mammals.',
    author: author,
    authorSecret: keypair.secret,
});
*/
kw.set({
    format: 'kw.1',
    key: `~${author}/about/name`,
    value: 'Example Sam',
    author: author,
    authorSecret: keypair.secret,
});
kw.set({
    format: 'kw.1',
    key: `~${author}/about/details`,
    value: 'I am an example author',
    author: author,
    authorSecret: keypair.secret,
});

//================================================================================
// VIEWS

let htmlWrapper = (page : string) : string => 
    `<html>
    <head>
        <title>Keywing demo</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
        <style>
            * { box-sizing: border-box; }
            html {
                line-height: 21px;
                font-size: 16px;
                font-family: sans-serif;
                color: #222;
                background: white;
            }
            code {
                background: #e8f9dc;
                padding: 5px;
                border-radius: 3px;
                border: 1px solid #888;
                display: inline-block;
            }
        </style>
    <body>
        ${page}
    </body>
    </html>`

let apiDocs = `
    <h2>HTTP API</h2>
    <ul>
        <li>GET <a href="/api/items"><code>/api/keys</code></a> - list all keys</li>
        <li>GET <a href="/api/items"><code>/api/items</code></a> - list all items (including history)</li>
        <li>POST <a href="/api/items"><code>/api/items</code></a> - upload items (supply as a JSON array)</li>
    </ul>`;

let storeTable = (kw : IStore) : string =>
    `<h2>Store contents</h2>
    <table>
        <tr>
            <th>Key</th>
            <th>Value</th>
        </tr>
        ${kw.items().map(item =>
            `<tr>
                <td><code>${item.key}</code></td>
                <td>${item.value}</td>
            </tr>`).join('\n')}
    </table>`;

let indexPage = (kw : IStore) : string =>
    htmlWrapper(
        `<h1>Keywing</h1>
        <p>This is an example pub server.  It's hosting a Keywing database (on the server) with these hardcoded details:</p>
        <blockquote>
            <p>Workspace: <code>${workspace}</code><br/></p>
            <p>Author pubkey: <code>${author}</code></p>
            <p>Author secret: <code>${keypair.secret}</code></p>
        </blockquote>
        <hr />
        ${storeTable(kw)}
        <hr />
        ${apiDocs}
        `
    );

//================================================================================
// EXPRESS

let app = express();
let port = 3333;
app.get('/', (req, res) => {
    res.send(indexPage(kw));
});
app.get('/api/keys', (req, res) => {
    res.json(kw.keys());
});
app.get('/api/items', (req, res) => {
    res.json(kw.items({ includeHistory: true }));
});
app.post('/api/items', express.json({type: '*/*'}), (req, res) => {
    let items : Item[] = req.body;
    let numIngested = 0;
    for (let item of items) {
        if (kw.ingestItem(item)) { numIngested += 1 }
    }
    res.json({
        numIngested: numIngested,
        numIgnored: items.length - numIngested,
        numTotal: items.length,
    });
});

app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
