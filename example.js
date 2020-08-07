"use strict";

/*

This file will work as a standalone pub on glitch.com.
It will import the rest of the earthstar-pub package from npm.
*/

/*
or to use this example in a new directory, locally:

mkdir my-pub
cd my-pub
npm init
npm install --save earthstar-pub
(... copy and paste example.js file into this directory ...)
node example.js
*/

const pub = require('earthstar-pub');
pub.serve({
    port: 8080,
    readonly: false,
    allowPushToNewWorkspaces: true,
});
console.log('running!');

