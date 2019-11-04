/* eslint-disable @typescript-eslint/no-var-requires */
const lnrpcPkgJson = require('@radar/lnrpc/package.json');
const { join } = require('path');
const { outputFile, pathExists, readFile } = require('fs-extra');

/**
 * The lnrpc library copies the rpc.proto file on first use. Since the packaged
 * app on Mac stores the node_modules in app.asar, it cannot write the file at
 * runtime. This function does the copy manually and should be run before
 * packaging the app with electron-builder
 * see: https://github.com/RadarTech/lnrpc/blob/c45de55019fb112500ff586361738c3cf18f51e9/lib/lnrpc.js#L125
 */
const copyProto = async () => {
  console.log('Copying lnrpc rpc.proto file');
  const lnrpcPath = join('node_modules', '@radar', 'lnrpc');
  const protoSrc = join(
    lnrpcPath,
    `lnd/${lnrpcPkgJson.config['lnd-release-tag']}/rpc.proto`,
  );
  const protoDest = join(lnrpcPath, 'rpc.proto');

  console.log(` - src: ${protoSrc}`);
  console.log(` - dest: ${protoDest}`);
  if (!(await pathExists(protoDest))) {
    let grpcSrc = await readFile(protoSrc, 'utf8');
    // remove google annotations causing parse error on `grpc.load()`
    grpcSrc = grpcSrc.replace('import "google/api/annotations.proto";', '');
    await outputFile(protoDest, grpcSrc);
    console.log(' -> copied!');
  } else {
    console.log(' -> file already exists');
  }
};

copyProto();
