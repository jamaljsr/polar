// Jest 26 cannot resolve the `node:` prefix for core modules (used by uuid@10,
// a dependency of dockerode), so `node:crypto` is mapped to this file instead.
// Remove once Jest is upgraded to a version that supports `node:` imports.
module.exports = require('crypto');
