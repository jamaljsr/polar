/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-template-curly-in-string */
import { ComposeService } from './composeFile';

// simple function to remove all line-breaks and extra white-space inside of a string
const trimInside = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const bitcoind = (
  name: string,
  container: string,
  version: string,
  rpcPort: number,
): ComposeService => ({
  image: `polarlightning/bitcoind:${version}`,
  container_name: container,
  environment: {
    USERID: '${USERID:-1000}',
    GROUPID: '${GROUPID:-1000}',
  },
  hostname: name,
  // Note: escape ($) rpcauth with ($$)
  command: trimInside(`
    bitcoind
      -server=1
      -regtest=1
      -rpcauth=polaruser:5e5e98c21f5c814568f8b55d83b23c1c$$066b03f92df30b11de8e4b1b1cd5b1b4281aa25205bd57df9be82caf97a05526
      -debug=0
      -zmqpubrawblock=tcp://0.0.0.0:28334
      -zmqpubrawtx=tcp://0.0.0.0:28335
      -txindex=1
      -dnsseed=0
      -upnp=0
      -rpcbind=0.0.0.0
      -rpcallowip=0.0.0.0/0
      -rpcport=18443
  `),
  volumes: [`./volumes/bitcoind/${name}:/home/bitcoin/.bitcoin`],
  expose: [
    '18443', // RPC
    '18444', // p2p
    '28334', // ZMQ blocks
    '28335', // ZMQ txns
  ],
  ports: [
    `${rpcPort}:18443`, // RPC
  ],
});

export const lnd = (
  name: string,
  container: string,
  version: string,
  backendName: string,
  restPort: number,
  grpcPort: number,
): ComposeService => ({
  image: `polarlightning/lnd:${version}`,
  container_name: container,
  environment: {
    USERID: '${USERID:-1000}',
    GROUPID: '${GROUPID:-1000}',
  },
  hostname: name,
  command: trimInside(`
    lnd
      --noseedbackup
      --alias=${name}
      --externalip=${name}
      --tlsextradomain=${name}
      --listen=0.0.0.0:9735
      --rpclisten=0.0.0.0:10009
      --restlisten=0.0.0.0:8080
      --bitcoin.active
      --bitcoin.regtest
      --bitcoin.node=bitcoind
      --bitcoind.rpchost=${backendName}
      --bitcoind.rpcuser=polaruser
      --bitcoind.rpcpass=polarpass
      --bitcoind.zmqpubrawblock=tcp://${backendName}:28334
      --bitcoind.zmqpubrawtx=tcp://${backendName}:28335
  `),
  restart: 'always',
  volumes: [`./volumes/lnd/${name}:/home/lnd/.lnd`],
  expose: [
    '8080', // REST
    '10009', // gRPC
    '9735', // p2p
  ],
  ports: [
    `${restPort}:8080`, // REST
    `${grpcPort}:10009`, // gRPC
  ],
});

export const lightningd = (
  name: string,
  container: string,
  version: string,
  backendName: string,
  restPort: number,
): ComposeService => ({
  image: `polarlightning/clightning:${version}`,
  container_name: container,
  environment: {
    USERID: '${USERID:-1000}',
    GROUPID: '${GROUPID:-1000}',
  },
  hostname: name,
  command: trimInside(`
    lightningd
      --alias=${name}
      --network=regtest
      --bitcoin-rpcuser=polaruser
      --bitcoin-rpcpassword=polarpass
      --bitcoin-rpcconnect=${backendName}
      --bitcoin-rpcport=18443
      --log-level=debug
      --plugin=/opt/c-lightning-rest/plugin.js
      --rest-port=8080
      --rest-protocol=http
  `),
  restart: 'always',
  volumes: [
    `./volumes/clightning/${name}/lightning:/root/.lightning`,
    `./volumes/clightning/${name}/rest-api:/opt/c-lightning-rest/certs`,
  ],
  expose: [
    '8080', // REST
    '9735', // p2p
  ],
  ports: [
    `${restPort}:8080`, // REST
  ],
});
