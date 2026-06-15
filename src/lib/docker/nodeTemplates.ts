import { dockerConfigs } from 'utils/constants';
/* eslint-disable no-template-curly-in-string */
import { ComposeService } from './composeFile';

// simple function to remove all line-breaks and extra white-space inside of a string
const trimInside = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const bitcoind = (
  name: string,
  container: string,
  image: string,
  rpcPort: number,
  p2pPort: number,
  zmqBlockPort: number,
  zmqTxPort: number,
  command: string,
): ComposeService => ({
  image,
  container_name: container,
  hostname: name,
  stop_grace_period: '5m',
  command: trimInside(command),
  volumes: [
    `./volumes/${dockerConfigs.bitcoind.volumeDirName}/${name}:/home/bitcoin/.bitcoin`,
  ],
  expose: [
    '18443', // RPC
    '18444', // p2p
    '28334', // ZMQ blocks
    '28335', // ZMQ txns
  ],
  ports: [
    `${rpcPort}:18443`, // RPC
    `${p2pPort}:18444`, // P2P
    `${zmqBlockPort}:28334`, // ZMQ blocks
    `${zmqTxPort}:28335`, // ZMQ txns
  ],
});

export const lnd = (
  name: string,
  container: string,
  image: string,
  restPort: number,
  grpcPort: number,
  p2pPort: number,
  command: string,
): ComposeService => ({
  image,
  container_name: container,
  hostname: name,
  command: trimInside(command),
  restart: 'always',
  volumes: [`./volumes/${dockerConfigs.LND.volumeDirName}/${name}:/home/lnd/.lnd`],
  expose: [
    '8080', // REST
    '10009', // gRPC
    '9735', // p2p
  ],
  ports: [
    `${restPort}:8080`, // REST
    `${grpcPort}:10009`, // gRPC
    `${p2pPort}:9735`, // p2p
  ],
});

export const clightning = (
  name: string,
  container: string,
  image: string,
  restPort: number,
  grpcPort: number,
  p2pPort: number,
  command: string,
  regtestVolumeName?: string,
): ComposeService => ({
  image,
  container_name: container,
  hostname: name,
  command: trimInside(command),
  restart: 'always',
  volumes: [
    `./volumes/${dockerConfigs['c-lightning'].volumeDirName}/${name}/${dockerConfigs['c-lightning'].dataDir}:/home/clightning/.lightning`,
    `./volumes/${dockerConfigs['c-lightning'].volumeDirName}/${name}/${dockerConfigs['c-lightning'].apiDir}:/opt/c-lightning-rest/certs`,
    // On Windows, mount a named volume over just the `regtest` subdir. CLN's
    // gossipd cannot write+rename gossip_store on a Windows bind mount, but the
    // rest of the data dir (debug.log, admin.rune) stays on the host bind so
    // logs and files remain visible/tailable on the host.
    ...(regtestVolumeName
      ? [`${regtestVolumeName}:/home/clightning/.lightning/regtest`]
      : []),
  ],
  expose: [
    '8080', // REST
    grpcPort ? '11001' : '', // GRPC
    '9735', // p2p
  ].filter(p => !!p), // filter out empty strings
  ports: [
    `${restPort}:8080`, // REST
    grpcPort ? `${grpcPort}:11001` : '', // REST
    `${p2pPort}:9735`, // p2p
  ].filter(p => !!p), // filer out empty strings
});

export const eclair = (
  name: string,
  container: string,
  image: string,
  restPort: number,
  p2pPort: number,
  command: string,
): ComposeService => ({
  image,
  container_name: container,
  hostname: name,
  command: trimInside(command),
  restart: 'always',
  volumes: [
    `./volumes/${dockerConfigs.eclair.volumeDirName}/${name}:/home/eclair/.eclair`,
  ],
  expose: [
    '8080', // REST
    '9735', // p2p
  ],
  ports: [
    `${restPort}:8080`, // REST
    `${p2pPort}:9735`, // p2p
  ],
});

export const tapd = (
  name: string,
  container: string,
  image: string,
  restPort: number,
  grpcPort: number,
  lndName: string,
  command: string,
): ComposeService => ({
  image,
  container_name: container,
  hostname: name,
  command: trimInside(command),
  restart: 'always',
  volumes: [
    `./volumes/${dockerConfigs.LND.volumeDirName}/${lndName}:/home/tap/.lnd`,
    `./volumes/${dockerConfigs.tapd.volumeDirName}/${name}:/home/tap/.tapd`,
  ],
  expose: [
    '8089', // REST
    '10029', // gRPC
  ],
  ports: [
    `${restPort}:8089`, // REST
    `${grpcPort}:10029`, // gRPC
  ],
});

export const litd = (
  name: string,
  container: string,
  image: string,
  restPort: number,
  grpcPort: number,
  p2pPort: number,
  webPort: number,
  command: string,
): ComposeService => ({
  image,
  container_name: container,
  hostname: name,
  command: trimInside(command),
  restart: 'always',
  volumes: [
    `./volumes/${dockerConfigs.litd.volumeDirName}/${name}/lit:/home/litd/.lit`,
    `./volumes/${dockerConfigs.litd.volumeDirName}/${name}/lnd:/home/litd/.lnd`,
    `./volumes/${dockerConfigs.litd.volumeDirName}/${name}/tapd:/home/litd/.tapd`,
  ],
  expose: [
    '8080', // REST
    '10009', // gRPC
    '9735', // p2p
    '8443', // web
  ],
  ports: [
    `${restPort}:8080`, // REST
    `${grpcPort}:10009`, // gRPC
    `${p2pPort}:9735`, // p2p
    `${webPort}:8443`, // web
  ],
});

export const simln = (
  name: string,
  container: string,
  image: string,
  command: string,
  environment: Record<string, string>,
  extraVolumes: string[] = [],
): ComposeService => ({
  image,
  container_name: container,
  hostname: name,
  command: trimInside(command),
  environment,
  restart: 'always',
  volumes: [
    `./volumes/${name}:/home/simln/.simln`,
    `./volumes/${dockerConfigs.LND.volumeDirName}:/home/simln/.lnd`,
    `./volumes/${dockerConfigs['c-lightning'].volumeDirName}:/home/simln/.c-lightning`,
    `./volumes/${dockerConfigs.litd.volumeDirName}:/home/simln/.litd`,
    // On Windows, CLN gRPC certs live in named volumes (see `clightning`), so
    // they aren't visible via the host bind above. Mount each CLN's regtest
    // volume so SimLN can read the certs at the path it expects.
    ...extraVolumes,
  ],
  expose: [],
  ports: [],
});
