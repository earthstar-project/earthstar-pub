#!/usr/bin/env node

import path = require('path');
import express = require('express');
import cors = require('cors');

import {
    AuthorKeypair,
    Document,
    IStorage,
    LayerAbout,
    LayerWiki,
    StorageMemory,
    ValidatorEs3,
} from 'earthstar';

let log = console.log;
let logVerbose = console.log;

//================================================================================
// EARTHSTAR SETUP

let VALIDATORS = [ValidatorEs3];
let FORMAT = 'es.3';
let DEMO_WORKSPACE = '+gardening.xxxxxxxxxxxxxxxxxxxx';
let makeDemoStorage = () : IStorage => {
    let storage = new StorageMemory(VALIDATORS, DEMO_WORKSPACE);
    let keypair : AuthorKeypair = {
        address: '@pubb.DGiggwVGtAkAKsntdDcCwXJbBUR8VZz1RhYePc6DgJPG',
        secret: 'HwjJZ6JywabNm9RAb21mRfCPT7qYo8ECnFJw2Afeo9MZ',
    }
    let author = keypair.address;

    let about = new LayerAbout(storage);
    let wiki = new LayerWiki(storage);

    about.setMyAuthorLongname(keypair, 'Example author from the pub');
    wiki.setPageText(
        keypair,
        LayerWiki.makePagePath('shared', 'A page from the pub'),
        'This page was created on the pub as part of the example +gardening workspace, '+
        'so there would be some pages to sync around.'
    );
    return storage;
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

                --cPath: #ffe2b8;
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
            .cPath { background: var(--cPath); }
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
        <h1>🗃 Earthstar Pub</h1>
        <p>This is a demo pub server hosting the following workspaces:</p>
        <ul>
        ${workspaces.length === 0 ? `
            <li><i>No workspaces yet.  Create one by syncing with this pub, or</i></li>
                <form action="/demo-hack/create-demo-workspace" method="post">
                    <input type="submit" name="make-demo" value="Create a demo workspace" />
                </form>
            </li>
        ` : ''}
        ${workspaces.map(ws =>
            `<li>📂 <a href="/workspace/${safe(ws)}"><code class="cWorkspace">${safe(ws)}</code></a></li>`
        ).join('\n')}
        </ul>
        <h2>How to use</h2>
        <p>You can sync with this pub using <a href="https://github.com/cinnamon-bun/earthstar-cli">earthstar-cli</a>.</p>
        <p>First create a local database with the same workspace name:</p>
        <p><code>$ earthstar create localfile.sqlite ${safe(DEMO_WORKSPACE)}</code></p>
        Then you can sync:
        <p><code>$ earthstar sync localfile.sqlite http://localhost:3333/</code></p>
        <hr/>
        <p><small><a href="https://github.com/cinnamon-bun/earthstar">Earthstar on Github</a></small></p>
        `
    );

let workspaceDetails = (storage : IStorage) : string =>
    htmlHeaderAndFooter(
        `<p><a href="/">&larr; Home</a></p>
        <h2>📂 Workspace: <code class="cWorkspace">${safe(storage.workspace)}</code></h2>
        <hr />
        ${pathsAndValues(storage)}
        <hr />
        ${apiDocs(storage.workspace)}
        <hr />
        <form action="/earthstar-api/v1/workspace/${safe(storage.workspace)}/delete" method="post">
            <input type="submit" name="upvote" value="Delete this workspace" />
        </form>
        `
    );

let apiDocs = (workspace : string) =>
    `<h2>HTTP API</h2>
    <p>NOTE: Workspaces start with a double slash.  The double slash should be omitted when building these URLs.
    <ul>
        <li>GET  <a href="/earthstar-api/v1/workspace/${safe(workspace)}/paths"><code>/earthstar-api/v1/workspace/:workspace/paths</code></a> - list all paths</li>
        <li>GET  <a href="/earthstar-api/v1/workspace/${safe(workspace)}/documents"><code>/earthstar-api/v1/workspace/:workspace/documents</code></a> - list all documents (including history)</li>
        <li>POST <code>/earthstar-api/v1/workspace/:workspace/documents</code> - upload documents (supply as a JSON array)</li>
    </ul>`;

let pathsAndValues = (storage : IStorage) : string =>
    `<h2>Paths and values</h2>` + 
    storage.documents().map(doc =>
        `<div>📄 <code class="cPath">${safe(doc.path)}</code></div>
        <div><pre class="cValue indent">${safe(doc.value)}</pre></div>
        <details class="indent">
            <summary>...</summary>
            ${
                storage.documents({ path: doc.path, includeHistory: true, }).map((historyDoc, ii) => {
                    console.log(doc.path, historyDoc.path);
                    let outlineClass = ii === 0 ? 'outlined' : ''
                    return `<pre class="small ${outlineClass}">${JSON.stringify(historyDoc, null, 2)}</pre>`
                }).join('\n')
            }
        </details>
        <div>&nbsp;</div>
        `
    ).join('\n');

//================================================================================
// COMMAND LINE

export interface PubOpts {
    port : number,
    readonly : boolean,
    allowPushToNewWorkspaces : boolean,
};

//================================================================================
// EXPRESS

export let serve = (opts : PubOpts) => {
    // a structure to hold our Earthstar workspaces
    let workspaceToStore : {[ws : string] : IStorage} = {};

    // add the demo store
    let demoStorage = makeDemoStorage();
    workspaceToStore[demoStorage.workspace] = demoStorage;

    let obtainStorage = (workspace : string, createOnDemand : boolean) : IStorage | undefined => {
        log('obtainStorage', workspace);
        let storage = workspaceToStore[workspace];
        if (storage !== undefined) { return storage; }
        if (createOnDemand) {
            storage = new StorageMemory(VALIDATORS, workspace);
            workspaceToStore[workspace] = storage;
            return storage;
        } 
        return undefined;
    }

    let app = express();
    app.use(cors());

    let publicDir = path.join(__dirname, '../public/static' );
    app.use('/static', express.static(publicDir));

    // for humans
    app.get('/', (req, res) => {
        let workspaces = Object.keys(workspaceToStore);
        workspaces.sort();
        res.send(listOfWorkspaces(workspaces));
    });
    app.get('/workspace/:workspace', (req, res) => {
        let workspace = req.params.workspace;
        console.log(workspace);
        let storage = obtainStorage(workspace, false);
        if (storage === undefined) { res.sendStatus(404); return; };
        res.send(workspaceDetails(storage));
    });

    // api
    app.get('/earthstar-api/v1/workspace/:workspace/paths', (req, res) => {
        let workspace = req.params.workspace;
        let storage = obtainStorage(workspace, false);
        if (storage === undefined) { res.sendStatus(404); return; };
        logVerbose('giving paths');
        res.json(storage.paths());
    });
    app.get('/earthstar-api/v1/workspace/:workspace/documents', (req, res) => {
        let workspace = req.params.workspace;
        let storage = obtainStorage(workspace, false);
        if (storage === undefined) { res.sendStatus(404); return; };
        logVerbose('giving documents');
        res.json(storage.documents({ includeHistory: true }));
    });

    app.post('/earthstar-api/v1/workspace/:workspace/documents', express.json({type: '*/*'}), (req, res) => {
        if (opts.readonly) { res.sendStatus(403); return; }
        let workspace = req.params.workspace;
        let storage = obtainStorage(workspace, opts.allowPushToNewWorkspaces);
        if (storage === undefined) { res.sendStatus(404); return; };
        logVerbose('ingesting documents');
        let docs : Document[] = req.body;
        let numIngested = 0;
        for (let doc of docs) {
            if (storage.ingestDocument(doc)) { numIngested += 1 }
        }
        res.json({
            numIngested: numIngested,
            numIgnored: docs.length - numIngested,
            numTotal: docs.length,
        });
    });

    // quick hack to allow removing workspaces from the demo pub
    // (they will come back if you sync them again)
    app.post('/earthstar-api/v1/workspace/:workspace/delete', (req, res) => {
        let workspace = req.params.workspace;
        logVerbose('deleting workspace: ', workspace);
        delete workspaceToStore[workspace];
        res.redirect('/');
    });
    // quick hack to restore the demo workspace
    app.post('/demo-hack/create-demo-workspace', (req, res) => {
        logVerbose('creating demo workspace');
        let demoStore = makeDemoStorage();
        workspaceToStore[demoStore.workspace] = demoStore;
        res.redirect('/');
    });


    app.listen(opts.port, () => log(`Listening on http://localhost:${opts.port}`));
}
