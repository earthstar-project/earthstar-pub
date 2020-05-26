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
import { appendFile, lchown } from 'fs';

//================================================================================
// KEYWING SETUP

let demoWorkspace = 'test';
let demoKw = new StoreMemory([ValidatorKw1], demoWorkspace);
let demoKeypair : Keypair = {
    public: 'Ki6aDqWS5O5pQlmrQWv2kT97abIWCC0wqbMrwoqoZq0=',
    secret: 'VSdYKDZzl2A4Cm7AW5GGgGWv3MtNKszf7bOcvgW/LRo='
}
let demoAuthor = keywing.addSigilToKey(demoKeypair.public);

demoKw.set({
    format: 'kw.1',
    key: 'wiki/kittens',
    value: 'Kittens are small mammals',
    author: demoAuthor,
    authorSecret: demoKeypair.secret,
});
demoKw.set({
    format: 'kw.1',
    key: 'wiki/puppies',
    value: 'Puppies go bark bark',
    author: demoAuthor,
    authorSecret: demoKeypair.secret,
});
demoKw.set({
    format: 'kw.1',
    key: `~${demoAuthor}/about/name`,
    value: 'Example Sam',
    author: demoAuthor,
    authorSecret: demoKeypair.secret,
});

//================================================================================
// VIEWS

// from https://stackoverflow.com/questions/40263803/native-javascript-or-es6-way-to-encode-and-decode-html-entities
// escape HTML-related characters
let safe = (str : string) =>
    str.replace(/[&<>'"]/g, (tag) => (({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    } as any)[tag]));

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
                padding: 10px;
            }
            code {
                background: #e8f9dc;
                padding: 4px 7px;
                margin: 2px;
                border-radius: 3px;
                border: 1px solid #888;
                display: inline-block;
                word-break: break-all;
                font-size: 16px;
            }
            td { vertical-align: top; }
            pre {
                background: #f9eadc;
                padding: 4px 7px;
                margin: 2px;
                border-radius: 3px;
                border: 1px solid #888;
                word-break: break-all;
                white-space: pre-wrap;
            }
            a code {
                text-decoration: underline;
            }
        </style>
    <body>
        ${page}
    </body>
    </html>`

let apiDocs = (workspace : string) =>
    `<h2>HTTP API</h2>
    <ul>
        <li>GET  <a href="/keywing/${workspace}/keys"><code>/workspace/:workspace/keys</code></a> - list all keys</li>
        <li>GET  <a href="/keywing/${workspace}/items"><code>/workspace/:workspace/items</code></a> - list all items (including history)</li>
        <li>POST <code>/workspace/:workspace/items</code> - upload items (supply as a JSON array)</li>
    </ul>`;

let storeTable = (kw : IStore) : string =>
    `<table>
        <tr>
            <th>Key</th>
            <th>Value</th>
        </tr>
        ${kw.items().map(item =>
            `<tr>
                <td>
                    <details>
                        <summary>
                            <code>${safe(item.key)}</code>
                        </summary>
                        <pre>${JSON.stringify(item, null, 2)}</pre>
                    </details>
                </td>
                <td><code>${safe(item.value)}</code></td>
            </tr>`).join('\n')}
    </table>`;

let workspaceOverview = (kw : IStore) : string =>
    htmlWrapper(
        `<p><a href="/">&larr; Home</a></p>
        <h2>Workspace: <code>${safe(kw.workspace)}</code></h2>
        <hr />
        ${storeTable(kw)}
        <hr />
        ${apiDocs(kw.workspace)}
        `
    );
    /*
        <p>Example author:</p>
        <blockquote>
            <p>pubkey: <code>${safe(demoAuthor)}</code></p>
            <p>secret: <code>${safe(demoKeypair.secret)}</code></p>
        </blockquote>
        <hr />
    */

let indexPage = (workspaces : string[]) : string =>
    htmlWrapper(
        `<h1>Keywing Pub</h1>
        <p>This is a demo pub hosting the following workspaces:</p>
        <ul>
        ${workspaces.map(ws =>
            `<li><a href="/keywing/${safe(ws)}"><code>${safe(ws)}</code></a></li>`
        ).join('\n')}
        </ul>
        <hr/>
        <p><small><a href="https://github.com/cinnamon-bun/keywing">Keywing on Github</a></small></p>
        `
    );


//================================================================================
// EXPRESS

let makeNewWorkspacesOnDemand = true;

let workspaceToStore : {[ws : string] : IStore} = {};

// add our test store from above
workspaceToStore[demoWorkspace] = demoKw;

let obtainKw = (workspace : string) : IStore | undefined => {
    let kw = workspaceToStore[workspace];
    if (kw !== undefined) { return kw; }
    if (makeNewWorkspacesOnDemand) {
        kw = new StoreMemory([ValidatorKw1], workspace);
        workspaceToStore[workspace] = kw;
        return kw;
    } 
    return undefined;
}

let app = express();
let port = 3333;
app.get('/', (req, res) => {
    let workspaces = Object.keys(workspaceToStore);
    workspaces.sort();
    res.send(indexPage(workspaces));
});
app.get('/keywing/:workspace', (req, res) => {
    let kw = obtainKw(req.params.workspace);
    if (kw === undefined) { res.sendStatus(404); return; };
    res.send(workspaceOverview(kw));
});
app.get('/keywing/:workspace/keys', (req, res) => {
    let kw = obtainKw(req.params.workspace);
    if (kw === undefined) { res.sendStatus(404); return; };
    res.json(kw.keys());
});
app.get('/keywing/:workspace/items', (req, res) => {
    let kw = obtainKw(req.params.workspace);
    if (kw === undefined) { res.sendStatus(404); return; };
    res.json(kw.items({ includeHistory: true }));
});
app.post('/keywing/:workspace/items', express.json({type: '*/*'}), (req, res) => {
    let kw = obtainKw(req.params.workspace);
    if (kw === undefined) { res.sendStatus(404); return; };
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
