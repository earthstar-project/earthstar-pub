> # Outdated: for running a web-connected earthstar peer, see [replica server](https://github.com/earthstar-project/replica-server)

# Earthstar Pub

> Note: we are probably renaming places where workspaces are stored from "storages" to "pockets".  Pubs will be renamed to "cloud pocket servers".

Hosts and syncs [Earthstar](https://github.com/cinnamon-bun/earthstar) workspaces over HTTP.  One pub server can hold multiple Earthstar workspaces.

Data is stored in an SQLite file.  You can also just keep data in memory if you don't have a persistent filesystem on your server, but it will be lost when the server restarts... and then sync'd again from the clients. :)

You can
* View the data through a web interface
* Sync your local data to/from the server using [earthstar-cli](https://github.com/cinnamon-bun/earthstar-cli/)
* Sync to Earthstar web apps such as Twodays-Crossing, Earthstar-Foyer, Earthstar-Lobby, etc.

Pub servers don't sync directly to each other (yet?) and clients don't sync directly to each other (yet).  Only Pub<-->Client connections are made.  But each client can talk to several pubs, and it decides which pubs it wants to push its workspaces to.


## Demo

https://earthstar-demo-pub-v6-a.glitch.me/

![](img/pub-homepage.png)

![](img/pub-workspace.png)

# How to deploy

## Run on Glitch.com

Make your own copy on Glitch by going [here](https://glitch.com/~earthstar-demo-pub-v6-a) and clicking "Remix this".

Or start a new Glitch project from scratch:

* Make a new Express project
* Go to Glitch's `package.json`, click "Add package", and add `earthstar-pub`
* Delete the demo code from `server.js`
* Copy-paste the code from this repo's [`example.js`](https://github.com/earthstar-project/earthstar-pub/blob/master/example.js) into Glitch's `server.js`
* Rename your project, at the top left
* Click "🕶 Show > In a New Window" to visit your pub

On Glitch, the sqlite data is stored in a special hidden directory (maybe called `/.data`, I don't remember) which nobody can see or clone from your project.  Files in that directory persist even when Glitch restarts your app.

If the pub is running just in memory-storage mode, it will forget all the data when Glitch restarts it (which happens often).

## Easy command-line install on your local machine

Install
```
npm install --global earthstar-pub
```

Run
```
earthstar-pub
```

Then visit http://localhost:3333.

Options:
```
Usage: earthstar-pub [options]

Run an HTTP server which hosts and replicates Earthstar workspaces.

Options:
  -p, --port <port>   Which port to serve on
                        (default: "3333")

  --readonly          Don't accept any pushed data from users
                        (default: false)

  -c, --closed        Accept data to existing workspaces but
                        don't create new workspaces.
                        (default: false)

  -d, --discoverable  Allow workspace addresses to be discovered
                        via the web interface.  Only use
                        this for testing purposes.
                        (default: false)

  -s, --sqlite        Use sqlite instead of memory.  Default is memory.
                        (default: false)

  --dataFolder <folder>
                      Folder in which to store sqlite files.
                        Defaults to current directory.
                        Only used for sqlite, not memory.
                        (default: ".")
                      
  --logLevel <logLevel>
                      Show this many logs. 0 = none, 1 = basic, 2 = verbose,
                        3 = include sensitive information (workspace addresses).
                        (default: "0")

  -t, --title <title> A title for your pub, shown on the main page

  -n, --notes <notes> Longer notes about your pub, shown on the main page
```

## Run on a Raspberry Pi

See [this wiki page](https://github.com/earthstar-project/earthstar-pub/wiki/Earthstar-Pub-on-a-Raspberry-Pi)

## Run on fly.io

[Fly.io](https://fly.io/) is an easy way to run Node apps and Dockerfiles.  They have a free tier.  You get a subdomain with SSL and you can add a persistent filesystem for $0.15/gb/month.

A test pub is running on Fly:
<a href="https://earthstar-demo-pub-6b.fly.dev/">`https://earthstar-demo-pub-6b.fly.dev/`</a>

Follow the [default setup steps for a Node app](https://fly.io/docs/getting-started/node/) but you need to change the app name to something you like, and change all ports `8080` to `3333` in the config file since that's our default port.

Get a local copy of this repo:
* `git clone git@github.com:earthstar-project/earthstar-pub.git`
* `cd earthstar-pub`
* `npm install; npm build`

Deploy on Fly:
* [Install the `flyctl` command line tool](https://fly.io/docs/getting-started/installing-flyctl/)
* Make an account:
  * `flyctl auth signup`
  * Check your email and click the link there to get into the [Fly dashboard](https://fly.io/apps).
* Prepare for deployment - this figures out that you have a Node app and makes a config file.
  * `flyctl launch --name my-cool-earthstar-pub`
  * don't actually deploy it yet
  * edit `fly.toml` and change all port `8080` to `3333`
* Actually deploy it.  This builds a Docker image which takes a minute; `--remote-only` makes it build the Docker image on their server instead of requiring you to have Docker installed on your own machine.
  * `flyctl deploy --remote-only`
* See info about your site
  * `flyctl status`
* See logs from your site
  * `flyctl logs`
* Launch your browser
  * `flyctl open`

Don't try to "suspend" or "resume" your site, that seems to break Fly.io.  Also it seems to fail if you delete a site and make a new one with the same name.

This isn't set up with a persistant volume for storing data, but the data seems to last "long enough" to be useful as a pub.  Fly.io doesn't shut down your server during periods of inactivity so your data will last a while, and even if it gets wiped it will be re-populated with data synced up from browser clients.

TODO: how to customize your pub using the `title` and `notes` field in [example.js](https://github.com/earthstar-project/earthstar-pub/blob/master/example.js).  Right now we're running the code using `npm run start` which uses all the default command line options; I'm not yet sure how to change the command line that runs.  We might have to make our own Dockerfile.

# Developing

Clone and install
```
git clone https://github.com/earthstar-project/earthstar-pub
cd earthstar-pub
npm install
```

Compile typescript
```
npm run build
```

Start the server
```
npm start
```

Then visit http://localhost:3333.
