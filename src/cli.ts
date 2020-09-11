#!/usr/bin/env node

import commander = require('commander');
import { serve } from './pub';

let program = new commander.Command();
program
    .name('earthstar-pub')
    .description('Run an HTTP server which hosts and replicates Earthstar workspaces.')
    .option('-p, --port <port>', 'Which port to serve on', '3333')
    .option('--readonly', "Don't accept any pushed data from users", false)
    .option('-c, --closed', "Accept data to existing workspaces but don't create new workspaces.", false)
    .option('-d, --discoverable', "Allow workspace addresses to be discovered via the web interface.  Only use this for testing purposes.", false)
    .option('-s, --sqlite', 'Use sqlite instead of memory.  Default is memory.', false)
    .option('--dataFolder <folder>', 'Folder in which to store sqlite files.  Defaults to current directory.  Only used for sqlite, not memory.', '.')
    .option('--logLevel <logLevel>', 'Show this many logs. 0 = none, 1 = basic, 2 = verbose, 3 = include sensitive information (workspace addresses).', '0');
    
program.parse(process.argv);

serve({
    port: +program.port,
    readonly: program.readonly,
    allowPushToNewWorkspaces: !(program.closed || program.readonly),
    discoverableWorkspaces: program.discoverable,
    storageType: program.sqlite ? 'sqlite' : 'memory',
    dataFolder: program.dataFolder,
    logLevel: +program.logLevel,
});
