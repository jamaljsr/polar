/* eslint-disable @typescript-eslint/camelcase */
import { bitcoinCredentials, dockerConfigs } from 'utils/constants';
/* eslint-disable no-template-curly-in-string */
import { ComposeService } from './composeFile';

// simple function to remove all line-breaks and extra white-space inside of a string
const trimInside = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const bitcoind = (
  name: string,
  container: string,
  version: string,
  rpcPort: number,
  peers: string[],
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
      -rpcauth=${bitcoinCredentials.user}:${bitcoinCredentials.rpcauth}
      ${peers.map(p => `-addnode=${p}`).join(' ')}
      -debug=0
      -zmqpubrawblock=tcp://0.0.0.0:28334
      -zmqpubrawtx=tcp://0.0.0.0:28335
      -txindex=1
      -dnsseed=0
      -upnp=0
      -rpcbind=0.0.0.0
      -rpcallowip=0.0.0.0/0
      -rpcport=18443
      -listen=1
      -listenonion=0
  `),
  volumes: [
    `./volumes/${dockerConfigs['bitcoind'].volumeDirName}/${name}:/home/bitcoin/.bitcoin`,
  ],
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
      --bitcoind.rpcuser=${bitcoinCredentials.user}
      --bitcoind.rpcpass=${bitcoinCredentials.pass}
      --bitcoind.zmqpubrawblock=tcp://${backendName}:28334
      --bitcoind.zmqpubrawtx=tcp://${backendName}:28335
  `),
  restart: 'always',
  volumes: [`./volumes/${dockerConfigs['LND'].volumeDirName}/${name}:/home/lnd/.lnd`],
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

export const clightning = (
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
      --addr=${name}
      --network=regtest
      --bitcoin-rpcuser=${bitcoinCredentials.user}
      --bitcoin-rpcpassword=${bitcoinCredentials.pass}
      --bitcoin-rpcconnect=${backendName}
      --bitcoin-rpcport=18443
      --log-level=debug
      --dev-bitcoind-poll=2
      --plugin=/opt/c-lightning-rest/plugin.js
      --rest-port=8080
      --rest-protocol=http
  `),
  restart: 'always',
  volumes: [
    `./volumes/${dockerConfigs['c-lightning'].volumeDirName}/${name}/data:/home/clightning/.lightning`,
    `./volumes/${dockerConfigs['c-lightning'].volumeDirName}/${name}/rest-api:/opt/c-lightning-rest/certs`,
  ],
  expose: [
    '8080', // REST
    '9735', // p2p
  ],
  ports: [
    `${restPort}:8080`, // REST
  ],
});
