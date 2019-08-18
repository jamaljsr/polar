/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-template-curly-in-string */
import { ComposeService } from './ComposeFile';

const trimInside = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const bitcoind = (name: string): ComposeService => ({
  image: 'bitcoind:0.18.0',
  container_name: name,
  user: 'bitcoin',
  command: trimInside(`
    bitcoind
      -server=1
      -regtest=1
      -rpcauth=kiteuser:d81315a082bcf36bcdcd640e816566f3$$a7a42c95772b9e7461f016a8c797f5729b494ad569555aea28f5c42ee2b3fcda
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
  image: 'lnd:0.7.1-beta',
  container_name: name,
  user: 'lnd',
  command: trimInside(`
    wait-for-it ${backendName}:18443 -- lnd
      --noseedbackup
      --tlsextradomain=lnd
      --listen=0.0.0.0:9735
      --rpclisten=0.0.0.0:10009
      --restlisten=0.0.0.0:8080
      --bitcoin.active
      --bitcoin.regtest
      --bitcoin.node=bitcoind
      --bitcoind.rpchost=${backendName}
      --bitcoind.rpcuser=kiteuser
      --bitcoind.rpcpass=kitepass
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
