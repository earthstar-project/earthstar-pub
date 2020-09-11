#!/usr/bin/env node

import fs = require('fs');
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
    ValidatorEs4,
    WriteResult,
    workspaceAddressChars,
    WorkspaceAddress,
    StorageSqlite,
    isErr,
} from 'earthstar';

//================================================================================
// EARTHSTAR SETUP

let VALIDATORS = [ValidatorEs4];
let FORMAT = 'es.4';

let DEMO_WORKSPACE = '+gardening.pals';
let setUpDemoStorage = (storage : IStorage) => {
    let keypair : AuthorKeypair = {
        address: "@bird.btr46n7ij6eq6hwnpvfcdakxqy3e6vz4e5vmw33ur7tjey5dkx6ea",
        secret: "bcrmyrih74d5mpvaco3tjrawgzebnmzyqdxvxnvg2hvnsfdj3izga"
    }
    let author = keypair.address;

    let about = new LayerAbout(storage);
    let wiki = new LayerWiki(storage);

    about.setMyAuthorProfile(keypair, {displayName: 'Bird, the example author'});
    wiki.setPageText(
        keypair,
        LayerWiki.makePagePath('shared', 'A page from the pub'),
        `This page was created on the pub as part of the example ${DEMO_WORKSPACE} workspace, ` +
        'so there would be some pages to sync around.'
    );
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
                --cContent: #c9fcb7;
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
            .cContent { background: var(--cContent); }
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

let listOfWorkspaces = (workspaces : string[], discoverableWorkspaces : boolean) : string => {
    let workspaceSection = `
        <p>This is a pub server hosting <b>${workspaces.length}</b> unlisted workspaces.</p>
        <p>If you know the workspace address, you can manually craft an URL to visit it:</p>
        <p><code><a href="/workspace/+your.workspace">/workspace/+your.workspace</a></code></p>
    `;
    if (discoverableWorkspaces) {
        workspaceSection = `
            <p>This is a pub server hosting the following workspaces:</p>
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
        `;
    }
    return htmlHeaderAndFooter(
        `<p><img src="/static/img/earthstar-logo-only.png" alt="earthstar logo" width=127 height=129 /></p>
        <h1>🗃 Earthstar Pub</h1>
        ${workspaceSection}
        <hr/>
        ${apiDocs('+exampleworkspace.12345')}
        <hr/>
        ${cliDocs('+exampleworkspace.12345')}
        <hr/>
        <p><small><a href="https://github.com/earthstar-project/earthstar">Earthstar on Github</a></small></p>
        `
    );
}

let workspaceDetails = (storage : IStorage) : string =>
    htmlHeaderAndFooter(
        `<p><a href="/">&larr; Home</a></p>
        <h2>📂 Workspace: <code class="cWorkspace">${safe(storage.workspace)}</code></h2>
        <p>
            <form action="/earthstar-api/v1/${safe(storage.workspace)}/delete" method="post">
                <input type="submit" name="upvote" value="Delete this workspace" />
            </form>
        </p>
        <hr />
        ${pathsAndContents(storage)}
        `
    );

let cliDocs = (workspaceAddress : WorkspaceAddress) : string =>
    `<h2>Sync with command line</h2>
    <p>You can sync with this pub using <a href="https://github.com/cinnamon-bun/earthstar-cli">earthstar-cli</a>.</p>
    <p>First create a local database with the same workspace name:</p>
    <p><code>$ earthstar create-workspace localfile.sqlite +exampleworkspace.12345</code></p>
    Then you can sync:
    <p><code>$ earthstar sync localfile.sqlite http://pub-url.com</code></p>
    `

let apiDocs = (workspace : string) =>
    `<h2>HTTP API</h2>
    <p>Replace <code>:workspace</code> with your actual workspace address, including its leading plus character.
    <ul>
        <li>GET  <a href="/earthstar-api/v1/${safe(workspace)}/paths"><code>/earthstar-api/v1/:workspace/paths</code></a> - list all paths</li>
        <li>GET  <a href="/earthstar-api/v1/${safe(workspace)}/documents"><code>/earthstar-api/v1/:workspace/documents</code></a> - list all documents (including history)</li>
        <li>POST <code>/earthstar-api/v1/:workspace/documents</code> - upload documents (supply as a JSON array)</li>
    </ul>`;

let pathsAndContents = (storage : IStorage) : string =>
    `<h2>Paths and contents</h2>` + 
    storage.documents().map(doc =>
        `<div>📄 <code class="cPath">${safe(doc.path)}</code></div>
        <div><pre class="cContent indent">${safe(doc.content)}</pre></div>
        <details class="indent">
            <summary>...</summary>
            ${
                storage.documents({ path: doc.path, includeHistory: true, }).map((historyDoc, ii) => {
                    let outlineClass = ii === 0 ? 'outlined' : ''
                    return `<pre class="small ${outlineClass}">${JSON.stringify(historyDoc, null, 2)}</pre>`
                }).join('\n')
            }
        </details>
        <div>&nbsp;</div>
        `
    ).join('\n');

//================================================================================
// EXPRESS SERVER

export interface PubOpts {
    port : number,
    readonly : boolean,
    allowPushToNewWorkspaces : boolean,
    discoverableWorkspaces : boolean,
    storageType : 'sqlite' | 'memory',
    dataFolder? : string,  // only needed for sqlite
    logLevel? : number,  // 0 none, 1 basic, 2 verbose, 3 sensitive
};

let workspaceToFilename = (dataFolder: string, workspace: WorkspaceAddress) =>
    path.join(dataFolder || '.', workspace.slice(1) + '.sqlite');
let filenameToWorkspace = (filename: string) => {
    if (filename.endsWith('.sqlite')) {
        filename = filename.slice(0, -7);
    }
    return '+' + path.basename(filename);
}

export let makeExpressApp = (opts : PubOpts) => {
    // returns an Express app but does not start running it.

    let logBasic = (...args: any[]) => {
        if (opts.logLevel && opts.logLevel >= 1) { console.log(...args); }
    }
    let logVerbose = (...args: any[]) => {
        if (opts.logLevel && opts.logLevel >= 2) { console.log(...args); }
    }
    let logSensitive = (...args: any[]) => {
        if (opts.logLevel && opts.logLevel >= 3) { console.log(...args); }
    }

    // a structure to hold our Earthstar workspaces
    let workspaceToStorage : {[ws : string] : IStorage} = {};

    // load existing files
    if (opts.storageType === 'sqlite' && opts.dataFolder !== undefined) {
        logVerbose('loading existing sqlite files');
        let files = fs.readdirSync(opts.dataFolder).filter(f => f.endsWith('.sqlite'));
        for (let fn of files) {
            let workspace = filenameToWorkspace(fn);
            logSensitive('    loading', fn, 'as workspace', workspace);
            let storage = new StorageSqlite({
                mode: 'create-or-open',
                workspace: workspace,
                validators: VALIDATORS,
                filename: path.join(opts.dataFolder, fn),
            });
            workspaceToStorage[workspace] = storage;
            logVerbose('    loaded');
        }
    }

    let obtainStorage = (workspace : string, createOnDemand : boolean, opts : PubOpts) : IStorage | undefined => {
        logSensitive('obtainStorage', workspace);
        let storage = workspaceToStorage[workspace];
        if (storage !== undefined) { return storage; }
        if (!createOnDemand) { return undefined; }

        // create workspace on demand
        if (opts.storageType === 'memory') {
            storage = new StorageMemory(VALIDATORS, workspace);
        } else if (opts.storageType === 'sqlite') {
            try {
                // make sure workspace address is valid so we know it will be a safe filename
                let err = VALIDATORS[0]._checkWorkspaceIsValid(workspace);
                if (isErr(err)) {
                    console.error(err);
                    console.error(workspace);
                    return undefined;
                }
                // build filename
                let filename = path.join(opts.dataFolder || '.', workspace.slice(1) + '.sqlite');  // remove '+'
                logSensitive('    sqlite filename:', filename);
                storage = new StorageSqlite({
                    mode: 'create-or-open',
                    workspace: workspace,
                    validators: VALIDATORS,
                    filename: filename,
                });
            } catch (err) {
                console.error('error creating sqlite file:');
                console.error(err);
                return undefined;
            }
        }
        workspaceToStorage[workspace] = storage;
        return storage;
    } 

    // add the demo store
    let demoStorage = obtainStorage(DEMO_WORKSPACE, true, opts);
    if (demoStorage !== undefined) {
        setUpDemoStorage(demoStorage);
        workspaceToStorage[demoStorage.workspace] = demoStorage;
    }

    // make express app
    let app = express();
    app.use(cors());

    let publicDir = path.join(__dirname, '../public/static' );
    app.use('/static', express.static(publicDir));

    // for humans
    app.get('/', (req, res) => {
        logVerbose('/');
        let workspaces = Object.keys(workspaceToStorage);
        workspaces.sort();
        res.send(listOfWorkspaces(workspaces, opts.discoverableWorkspaces));
    });
    app.get('/workspace/:workspace', (req, res) => {
        logVerbose('workspace view');
        let workspace = req.params.workspace;
        let storage = obtainStorage(workspace, false, opts);
        if (storage === undefined) { res.sendStatus(404); return; };
        res.send(workspaceDetails(storage));
    });

    // api
    app.get('/earthstar-api/v1/:workspace/paths', (req, res) => {
        logVerbose('giving paths');
        let workspace = req.params.workspace;
        let storage = obtainStorage(workspace, false, opts);
        if (storage === undefined) { res.sendStatus(404); return; };
        res.json(storage.paths());
    });
    app.get('/earthstar-api/v1/:workspace/documents', (req, res) => {
        logVerbose('giving documents');
        let workspace = req.params.workspace;
        let storage = obtainStorage(workspace, false, opts);
        if (storage === undefined) { res.sendStatus(404); return; };
        res.json(storage.documents({ includeHistory: true }));
    });

    app.post('/earthstar-api/v1/:workspace/documents', express.json({type: '*/*'}), (req, res) => {
        logVerbose('ingesting documents');
        if (opts.readonly) { res.sendStatus(403); return; }
        let workspace = req.params.workspace;
        let storage = obtainStorage(workspace, opts.allowPushToNewWorkspaces, opts);
        if (storage === undefined) { res.sendStatus(404); return; };
        let docs : Document[] = req.body;
        let numIngested = 0;
        for (let doc of docs) {
            if (storage.ingestDocument(doc) === WriteResult.Accepted) { numIngested += 1 }
        }
        res.json({
            numIngested: numIngested,
            numIgnored: docs.length - numIngested,  // ignored or failed validation check
            numTotal: docs.length,
        });
    });

    // quick hack to allow removing workspaces from the demo pub
    // (they will come back if you sync them again)
    app.post('/earthstar-api/v1/:workspace/delete', (req, res) => {
        logVerbose('deleting workspace');
        let workspace = req.params.workspace;
        delete workspaceToStorage[workspace];
        res.redirect('/');
    });
    // quick hack to restore the demo workspace
    app.post('/demo-hack/create-demo-workspace', (req, res) => {
        logVerbose('creating demo workspace');
        let demoStorage = obtainStorage(DEMO_WORKSPACE, true, opts);
        if (demoStorage !== undefined) {
            setUpDemoStorage(demoStorage);
            workspaceToStorage[demoStorage.workspace] = demoStorage;
        }
        res.redirect('/');
    });

    return app;
}

export let serve = (opts : PubOpts) => {
    // Make and start the Express server.
    console.log(opts);
    if (opts.storageType === 'sqlite') {
        if (opts.dataFolder === undefined) {
            console.error('sqlite mode requires dataFolder to be set');
            process.exit(-1);
        }
        if (!fs.existsSync(opts.dataFolder)) {
            console.error('sqlite mode requires dataFolder to already exist');
            process.exit(-1);
        }
    }
    let app = makeExpressApp(opts);
    app.listen(opts.port, () => console.log(`Listening on http://localhost:${opts.port}`));
}
