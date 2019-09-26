/**
 * this is the entrypoint for electron when developing locally. Using ts-node
 * allows us to write all of the electron main process code in typescript
 * and compile on the fly. The alternative approach is to run tsc to save
 * the compiled js code to disk, but this slows down the live reloading
 * done by nodemon.
 */

// import tsconfig
const config = require('../electron/tsconfig.json');
// register the typescript compiler
require('ts-node').register(config);
// import the main process typescript code
require('../electron');
