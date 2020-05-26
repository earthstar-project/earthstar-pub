# Keywing Pub

Hosts [Keywing](https://github.com/cinnamon-bun/keywing) databases via HTTP.

One pub can hold multiple Keywing workspaces.

You can
* View the data through a web interface
* Sync your local files to/from the server using [keywing-cli](https://github.com/cinnamon-bun/keywing-cli/)

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
keywing-pub
```

Then visit http://localhost:3333
