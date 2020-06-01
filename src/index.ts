#!/usr/bin/env node

import path = require('path');
import commander = require('commander');
import express = require('express');
import cors = require('cors');
import {
    IStore,
    IValidator,
    Item,
    Keypair,
    StoreMemory,
    ValidatorEs1,
    ValidatorUnsigned1,
} from 'earthstar';

//================================================================================
// EARTHSTAR SETUP

let getValidators = (unsigned : boolean | undefined) => {
    let vals : IValidator[] = [ValidatorEs1];
    if (unsigned === true) {
        vals.push(ValidatorUnsigned1);
        console.log('WARNING: Allowing unsigned items.  This is insecure.');
    }
    return vals;
}

let makeDemoStore = (unsigned : boolean | undefined) : IStore => {
    let demoWorkspace = 'demo';
    let demoStore = new StoreMemory(getValidators(unsigned), demoWorkspace);
    let format = unsigned === true ? 'unsigned.1' : 'es.1';
    let demoKeypair : Keypair = {
        public: "@AdETDG71U1nzWDmTPAz3z4Wz2jYuiTTJ4Uo9s4KjZ8oo",
        secret: "9jKLfpwuWd8pjtaux5jomzZD1ZSh5XBPh3SaRtCTsW6Y"
    }
    let demoAuthor = demoKeypair.public;

    demoStore.set(demoKeypair, {
        format: format,
        key: 'wiki/kittens',
        value: 'Kittens are small mammals',
    });
    demoStore.set(demoKeypair, {
        format: format,
        key: 'wiki/puppies',
        value: 'Puppies go bark bark',
    });
    demoStore.set(demoKeypair, {
        format: format,
        key: `~${demoAuthor}/about/name`,
        value: 'Example Sam',
    });
    return demoStore;
}

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
        <title>🌎⭐️ Earthstar Pub</title>
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
        <li>GET  <a href="/earthstar/${workspace}/keys"><code>/workspace/:workspace/keys</code></a> - list all keys</li>
        <li>GET  <a href="/earthstar/${workspace}/items"><code>/workspace/:workspace/items</code></a> - list all items (including history)</li>
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
        `<p><img src="/static/img/earthstar-logo-only.png" alt="earthstar logo" width=127 height=129 /></p>
        <h1>Earthstar Pub</h1>
        <p>This is a demo pub hosting the following workspaces:</p>
        <ul>
        ${workspaces.map(ws =>
            `<li><a href="/earthstar/${safe(ws)}"><code>${safe(ws)}</code></a></li>`
        ).join('\n')}
        </ul>
        <h2>How to use</h2>
        <p>You can sync with this pub using <a href="https://github.com/cinnamon-bun/earthstar-cli">earthstar-cli</a>.</p>
        <p>First create a local database with the same workspace name:</p>
        <p><code>$ earthstar create localfile.sqlite demo</code></p>
        Then you can sync:
        <p><code>$ earthstar sync localfile.sqlite http://localhost:3333/earthstar/</code></p>
        <hr/>
        <p><small><a href="https://github.com/cinnamon-bun/earthstar">Earthstar on Github</a></small></p>
        `
    );


//================================================================================
// COMMAND LINE


let program = new commander.Command();
program
    .name('earthstar-pub')
    .description('Run an HTTP server which hosts and replicates Earthstar workspaces.')
    .option('-p, --port <port>', 'which port to serve on', '3333')
    .option('--readonly', "don't accept any pushed data from users", false)
    .option('-c, --closed', "accept data to existing workspaces but don't create new workspaces.", false)
    //.option('-d, --dbfile <filename>', 'filename for sqlite database.  if omitted, data is only kept in memory')
    .option('--unsigned', 'Allow/create messages of type "unsigned.1" which do not have signatures.  This is insecure.  Only use it for testing.');
    
program.parse(process.argv);

let PORT : number = +program.port;
//let DBFILE : string | undefined = program.dbfile;
let READONLY : boolean = program.readonly;
let UNSIGNED : boolean = program.unsigned === true;
let ALLOW_PUSH_TO_NEW_WORKSPACES : boolean = !(program.closed || READONLY);

//================================================================================
// EXPRESS

// a structure to hold our Earthstar stores
let workspaceToStore : {[ws : string] : IStore} = {};

// add the demo store
let demoStore = makeDemoStore(UNSIGNED);
workspaceToStore[demoStore.workspace] = demoStore;

let obtainStore = (workspace : string, createOnDemand : boolean, unsigned : boolean | undefined) : IStore | undefined => {
    let kw = workspaceToStore[workspace];
    if (kw !== undefined) { return kw; }
    if (createOnDemand) {
        kw = new StoreMemory(getValidators(unsigned), workspace);
        workspaceToStore[workspace] = kw;
        return kw;
    } 
    return undefined;
}

let app = express();
app.use(cors());

let publicDir = path.join(__dirname, '../public/static');
app.use('/static', express.static(publicDir));

app.get('/', (req, res) => {
    let workspaces = Object.keys(workspaceToStore);
    workspaces.sort();
    res.send(indexPage(workspaces));
});
app.get('/earthstar/:workspace', (req, res) => {
    let kw = obtainStore(req.params.workspace, false, UNSIGNED);
    if (kw === undefined) { res.sendStatus(404); return; };
    res.send(workspaceOverview(kw));
});
app.get('/earthstar/:workspace/keys', (req, res) => {
    let kw = obtainStore(req.params.workspace, false, UNSIGNED);
    if (kw === undefined) { res.sendStatus(404); return; };
    res.json(kw.keys());
});
app.get('/earthstar/:workspace/items', (req, res) => {
    let kw = obtainStore(req.params.workspace, false, UNSIGNED);
    if (kw === undefined) { res.sendStatus(404); return; };
    res.json(kw.items({ includeHistory: true }));
});
app.post('/earthstar/:workspace/items', express.json({type: '*/*'}), (req, res) => {
    if (READONLY) { res.sendStatus(403); return; }
    let kw = obtainStore(req.params.workspace, ALLOW_PUSH_TO_NEW_WORKSPACES, UNSIGNED);
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

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
