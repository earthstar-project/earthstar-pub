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

let log = console.log;
let logVerbose = console.log;

//================================================================================
// EARTHSTAR SETUP

let getValidators = (unsigned : boolean | undefined) => {
    let vals : IValidator[] = [ValidatorEs1];
    if (unsigned === true) {
        vals.push(ValidatorUnsigned1);
        log('WARNING: Allowing unsigned items.  This is insecure.');
    }
    return vals;
}

let DEMO_WORKSPACE = 'demo';
let makeDemoStore = (unsigned : boolean | undefined) : IStore => {
    let demoStore = new StoreMemory(getValidators(unsigned), DEMO_WORKSPACE);
    let format = unsigned === true ? 'unsigned.1' : 'es.1';
    let demoKeypair : Keypair = {
        public: "@AdETDG71U1nzWDmTPAz3z4Wz2jYuiTTJ4Uo9s4KjZ8oo",
        secret: "9jKLfpwuWd8pjtaux5jomzZD1ZSh5XBPh3SaRtCTsW6Y"
    }
    let demoAuthor = demoKeypair.public;

    demoStore.set(demoKeypair, {
        format: format,
        key: 'wiki/Pub',
        value: 'Pubs are servers that help you sync.',
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

let htmlHeaderAndFooter = (page : string) : string => 
    `<html>
    <head>
        <title>🌎⭐️🗃 Earthstar Pub</title>
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
            :root {
                --ratio: 1.5;
                --s-5: calc(var(--s-4) / var(--ratio));
                --s-4: calc(var(--s-3) / var(--ratio));
                --s-3: calc(var(--s-2) / var(--ratio));
                --s-2: calc(var(--s-1) / var(--ratio));
                --s-1: calc(var(--s0) / var(--ratio));
                --s0: 1rem;
                --s1: calc(var(--s0) * var(--ratio));
                --s2: calc(var(--s1) * var(--ratio));
                --s3: calc(var(--s2) * var(--ratio));
                --s4: calc(var(--s3) * var(--ratio));
                --s5: calc(var(--s4) * var(--ratio));
                --round: var(--s0);

                --cKey: #ffe2b8;
                --cValue: #c9fcb7;
                --cWorkspace: #c5e8ff;
                --cAuthor: #f6cdff;

                --cAccentDark: #5e4d76;
                --cAccentLight: #a4f;

                --cGray90: #e2e2e2;
                --cGrayShadow: #bbb;
                --cGrayTextOnWhite: #888;
                --cWhite: #fff;
                --cBlack: #222;
                --cYellow: #fef8bb;
            }
            .cKey { background: var(--cKey); }
            .cValue { background: var(--cValue); }
            .cWorkspace { background: var(--cWorkspace); }
            .cAuthor { background: var(--cAuthor); }
            a code {
                text-decoration: underline;
            }
            code {
                background: #eee;
                padding: 4px 7px;
                margin: 2px;
                border-radius: 3px;
                border: 1px solid #888;
                display: inline-block;
                word-break: break-all;
                font-size: 16px;
            }
            pre {
                background: #eee;
                padding: 4px 7px;
                margin: 2px;
                border-radius: 3px;
                border: 1px solid #888;
                word-break: break-all;
                white-space: pre-wrap;
            }
            .small {
                font-size: 80%;
            }
            .outlined {
                border: 2px solid #444;
            }
            .indent {
                margin-left: 50px;
            }
            button, input[type="submit"] {
                background: var(--cAccentDark);
                color: var(--cWhite);
                padding: var(--s-2) var(--s-1);
                border: none;
                border-radius: var(--round);
                line-height: 21px;
                font-size: 16px;
            }
        </style>
    <body>
        ${page}
    </body>
    </html>`

let listOfWorkspaces = (workspaces : string[]) : string =>
    htmlHeaderAndFooter(
        `<p><img src="/static/img/earthstar-logo-only.png" alt="earthstar logo" width=127 height=129 /></p>
        <h1>Earthstar Pub</h1>
        <p>This is a demo pub hosting the following workspaces:</p>
        <ul>
        ${workspaces.length === 0 ? `
            <li><i>No workspaces yet.  Create one by syncing with this pub, or</i></li>
                <form action="/earthstar/create-demo-workspace" method="post">
                    <input type="submit" name="make-demo" value="Create a demo workspace" />
                </form>
            </li>
        ` : ''}
        ${workspaces.map(ws =>
            `<li><a href="/earthstar/${safe(ws)}"><code class="cWorkspace">${safe(ws)}</code></a></li>`
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

let workspaceDetails = (es : IStore) : string =>
    htmlHeaderAndFooter(
        `<p><a href="/">&larr; Home</a></p>
        <h2>Workspace: <code class="cWorkspace">${safe(es.workspace)}</code></h2>
        <hr />
        ${storeTable(es)}
        <hr />
        ${apiDocs(es.workspace)}
        <hr />
        <form action="/earthstar/${es.workspace}/delete" method="post">
            <input type="submit" name="upvote" value="Delete this workspace" />
        </form>
        `
    );
    /*
    */

let apiDocs = (workspace : string) =>
    `<h2>HTTP API</h2>
    <ul>
        <li>GET  <a href="/earthstar/${workspace}/keys"><code>/workspace/:workspace/keys</code></a> - list all keys</li>
        <li>GET  <a href="/earthstar/${workspace}/items"><code>/workspace/:workspace/items</code></a> - list all items (including history)</li>
        <li>POST <code>/workspace/:workspace/items</code> - upload items (supply as a JSON array)</li>
    </ul>`;

let storeTable = (kw : IStore) : string =>
    kw.items().map(item =>
        `<div><code class="cKey">${safe(item.key)}</code></div>
        <div><pre class="cValue indent">${safe(item.value)}</pre></div>
        <details class="indent">
            <summary>...</summary>
            ${
                kw.items({ key: item.key, includeHistory: true, }).map((subitem, ii) => {
                    let outlineClass = ii === 0 ? 'outlined' : ''
                    return `<pre class="small ${outlineClass}">${JSON.stringify(subitem, null, 2)}</pre>`
                }).join('\n')
            }
        </details>
        <div>&nbsp;</div>
        `
    ).join('\n');

            /*
            `<tr>
                <td>
                    <details>
                        <summary>
                            <code class="cKey">${safe(item.key)}</code>
                        </summary>
                        <pre>${JSON.stringify(item, null, 2)}</pre>
                    </details>
                </td>
                <td><code class="cValue">${safe(item.value)}</code></td>
            </tr>`).join('\n')}*/



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
let ALLOW_UNSIGNED : boolean = program.unsigned === true;
let ALLOW_PUSH_TO_NEW_WORKSPACES : boolean = !(program.closed || READONLY);

//================================================================================
// EXPRESS

// a structure to hold our Earthstar stores
let workspaceToStore : {[ws : string] : IStore} = {};

// add the demo store
let demoStore = makeDemoStore(ALLOW_UNSIGNED);
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

let publicDir = path.join(__dirname, '../public/static' );
app.use('/static', express.static(publicDir));

app.get('/', (req, res) => {
    let workspaces = Object.keys(workspaceToStore);
    workspaces.sort();
    res.send(listOfWorkspaces(workspaces));
});

app.get('/earthstar/', (req, res) => {
    res.redirect('/');
});

app.get('/earthstar/:workspace', (req, res) => {
    let es = obtainStore(req.params.workspace, false, ALLOW_UNSIGNED);
    if (es === undefined) { res.sendStatus(404); return; };
    res.send(workspaceDetails(es));
});
app.get('/earthstar/:workspace/keys', (req, res) => {
    let es = obtainStore(req.params.workspace, false, ALLOW_UNSIGNED);
    if (es === undefined) { res.sendStatus(404); return; };
    logVerbose('giving keys');
    res.json(es.keys());
});
app.get('/earthstar/:workspace/items', (req, res) => {
    let es = obtainStore(req.params.workspace, false, ALLOW_UNSIGNED);
    if (es === undefined) { res.sendStatus(404); return; };
    logVerbose('giving items');
    res.json(es.items({ includeHistory: true }));
});
app.post('/earthstar/:workspace/items', express.json({type: '*/*'}), (req, res) => {
    if (READONLY) { res.sendStatus(403); return; }
    let es = obtainStore(req.params.workspace, ALLOW_PUSH_TO_NEW_WORKSPACES, ALLOW_UNSIGNED);
    if (es === undefined) { res.sendStatus(404); return; };
    logVerbose('ingesting items');
    let items : Item[] = req.body;
    let numIngested = 0;
    for (let item of items) {
        if (es.ingestItem(item)) { numIngested += 1 }
    }
    res.json({
        numIngested: numIngested,
        numIgnored: items.length - numIngested,
        numTotal: items.length,
    });
});

// quick hack to allow removing workspaces from the demo pub
// (they will come back if you sync them again)
app.post('/earthstar/:workspace/delete', (req, res) => {
    logVerbose('deleting workspace: ', req.params.workspace);
    delete workspaceToStore[req.params.workspace];
    res.redirect('/');
});
// quick hack to restore the demo workspace
app.post('/earthstar/create-demo-workspace', (req, res) => {
    logVerbose('creating demo workspace');
    let demoStore = makeDemoStore(ALLOW_UNSIGNED);
    workspaceToStore[demoStore.workspace] = demoStore;
    res.redirect('/');
});


app.listen(PORT, () => log(`Listening on http://localhost:${PORT}`));
