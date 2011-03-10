# Nodelog

  Blogging software based on Node.js, Express, and MongoDB.

## Setup

  Make sure all the dependencies are installed, see package.json for exact versions.
 
    $ cp settings.js.default settings.js

  Edit appropriate fields in settings.js.

    $ node app.js

## Development

  `dev.sh` simply starts the server using `node-dev` in the development environment. `node-dev` automatically restarts the server when it detects code changes.

    $ npm install node-dev
    $ ./dev.sh
