/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-template-curly-in-string */
import { ComposeService } from './composeFile';

// simple function to remove all line-breaks and extra white-space in a string
const trimInside = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const bitcoind = (name: string): ComposeService => ({
  image: 'polarlightning/bitcoind:0.18.1',
  container_name: name,
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
  `),
  volumes: [`./volumes/${name}:/home/bitcoin/.bitcoin`],
  expose: [
    '18443', // RPC
    '18444', // p2p
    '28334', // ZMQ blocks
    '28335', // ZMQ txns
  ],
  ports: [
    // '18443:18443', // RPC
    // '28334:28334', // ZMQ blocks
    // '28335:28335', // ZMQ txns
  ],
});

export const lnd = (name: string, backendName: string): ComposeService => ({
  image: 'polarlightning/lnd:0.7.1-beta',
  container_name: name,
  command: trimInside(`
    lnd
      --noseedbackup
      --tlsextradomain=lnd
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
    '10000', // gRPC
    '8080', // REST
    '9735', // p2p
  ],
  ports: [
    // '11001:10000', // gRPC
    // '8001:8080', // REST
    // '9001:9735', // p2p
  ],
});
