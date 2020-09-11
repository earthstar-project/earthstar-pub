"use strict";

/*
    This file will work as a standalone pub on glitch.com.
    It will import the rest of the earthstar-pub package from npm.
*/

const pub = require('earthstar-pub');

const port = 8080;
pub.serve({
    port: port,
    readonly: false,  // if true, don't accept any new data from users to any workspace
    allowPushToNewWorkspaces: true,  // if true, let users add new workspaces
    discoverableWorkspaces: false,  // if true, show workspace addesses in the web interface
    storageType: 'sqlite',  // use sqlite instead of memory to store data
    dataFolder: '.data',  // put sqlite files here
    logLevel: 2,  // 2 = verbose, 3 = include sensitive info (workspace addresses)
});

console.log(`earthstar-pub is running on port ${port}.  ${new Date()}`);

