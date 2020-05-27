# Earthstar Pub

Hosts [Earthstar](https://github.com/cinnamon-bun/earthstar) workspaces via HTTP.

One pub server can hold multiple Earthstar workspaces.

You can
* View the data through a web interface
* Sync your local files to/from the server using [earthstar-cli](https://github.com/cinnamon-bun/earthstar-cli/)

Pub servers don't sync directly to each other (yet?).

## Usage

These options are hardcoded for now:
* port: 3333
* accept sync of new workspaces: true

Start the server with
```
npm start
```
or
```
earthstar-pub
```

Then visit http://localhost:3333
