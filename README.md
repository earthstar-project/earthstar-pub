# Earthstar Pub

Hosts [Earthstar](https://github.com/cinnamon-bun/earthstar) workspaces via HTTP.

One pub server can hold multiple Earthstar workspaces.

You can
* View the data through a web interface
* Sync your local files to/from the server using [earthstar-cli](https://github.com/cinnamon-bun/earthstar-cli/)

Pub servers don't sync directly to each other (yet?).

## Usage

Start the server with
```
npm start
```
or
```
earthstar-pub
```
Then visit http://localhost:3333.

Options:
```
Usage: earthstar-pub [options]

Run an HTTP server which hosts and replicates Earthstar workspaces.

Options:
  -p, --port <port>  which port to serve on (default: "3333")
  --readonly         don't accept any pushed data from users (default: false)
  -c, --closed       accept data to existing workspaces but don't create new workspaces.
                     (default: false)
  --unsigned         Allow/create messages of type "unsigned.1" which do not have signatures.
                     This is insecure.  Only use it for testing.
  -h, --help         display help for command
```

