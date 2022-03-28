import { NodeImplementation } from 'shared/types';
import { DockerConfig, DockerRepoState } from 'types';
import bitcoindLogo from 'resources/bitcoin.svg';
import clightningLogo from 'resources/clightning.png';
import eclairLogo from 'resources/eclair.png';
import lndLogo from 'resources/lnd.png';
import packageJson from '../../package.json';

// App
export const APP_VERSION = packageJson.version;

// Docker
export const DOCKER_REPO = 'polarlightning';

// bitcoind
export const INITIAL_BLOCK_REWARD = 50;
export const BLOCKS_TIL_CONFIRMED = 6;
export const COINBASE_MATURITY_DELAY = 100;
// https://github.com/bitcoin/bitcoin/blob/v0.19.0.1/src/chainparams.cpp#L258
export const HALVING_INTERVAL = 150;

// designer chart
export const LOADING_NODE_ID = 'loading_id';

// currency
export enum Denomination {
  SATOSHIS = 'SATOSHIS',
  BITCOIN = 'BITCOIN',
}

export const denominationSymbols: { [key in Denomination]: string } = {
  SATOSHIS: 'sats',
  BITCOIN: 'BTC',
};

export const denominationNames: { [key in Denomination]: string } = {
  SATOSHIS: 'Satoshis',
  BITCOIN: 'Bitcoin',
};

/**
 * The starting port numbers for the different node types. These should
 * be sufficiently spaced apart to allow a dozen or so numbers higher and
 * not cause conflicts
 */
export const BasePorts: Record<NodeImplementation, Record<string, number>> = {
  bitcoind: {
    rest: 18443,
    p2p: 19444,
    zmqBlock: 28334,
    zmqTx: 29335,
  },
  LND: {
    rest: 8081,
    grpc: 10001,
    p2p: 9735,
  },
  'c-lightning': {
    rest: 8181,
    p2p: 9835,
  },
  eclair: {
    rest: 8281,
    p2p: 9935,
  },
  btcd: {},
};

export const bitcoinCredentials = {
  user: 'polaruser',
  pass: 'polarpass',
  rpcauth:
    '5e5e98c21f5c814568f8b55d83b23c1c$$066b03f92df30b11de8e4b1b1cd5b1b4281aa25205bd57df9be82caf97a05526',
};

export const eclairCredentials = {
  pass: 'eclairpw',
};

export const dockerConfigs: Record<NodeImplementation, DockerConfig> = {
  LND: {
    name: 'LND',
    imageName: 'polarlightning/lnd',
    logo: lndLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'lnd',
    command: [
      'lnd',
      '--noseedbackup',
      '--trickledelay=5000',
      '--alias={{name}}',
      '--externalip={{name}}',
      '--tlsextradomain={{name}}',
      '--tlsextradomain={{containerName}}',
      '--listen=0.0.0.0:9735',
      '--rpclisten=0.0.0.0:10009',
      '--restlisten=0.0.0.0:8080',
      '--bitcoin.active',
      '--bitcoin.regtest',
      '--bitcoin.node=bitcoind',
      '--bitcoind.rpchost={{backendName}}',
      '--bitcoind.rpcuser={{rpcUser}}',
      '--bitcoind.rpcpass={{rpcPass}}',
      '--bitcoind.zmqpubrawblock=tcp://{{backendName}}:28334',
      '--bitcoind.zmqpubrawtx=tcp://{{backendName}}:28335',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['name', 'containerName', 'backendName', 'rpcUser', 'rpcPass'],
  },
  'c-lightning': {
    name: 'c-lightning',
    imageName: 'polarlightning/clightning',
    logo: clightningLogo,
    platforms: ['mac', 'linux'],
    volumeDirName: 'c-lightning',
    command: [
      'lightningd',
      '--alias={{name}}',
      '--addr={{name}}',
      '--network=regtest',
      '--bitcoin-rpcuser={{rpcUser}}',
      '--bitcoin-rpcpassword={{rpcPass}}',
      '--bitcoin-rpcconnect={{backendName}}',
      '--bitcoin-rpcport=18443',
      '--log-level=debug',
      '--dev-bitcoind-poll=2',
      '--dev-fast-gossip',
      '--plugin=/opt/c-lightning-rest/plugin.js',
      '--rest-port=8080',
      '--rest-protocol=http',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['name', 'backendName', 'rpcUser', 'rpcPass'],
    dataDir: 'lightningd',
    apiDir: 'rest-api',
  },
  eclair: {
    name: 'Eclair',
    imageName: 'polarlightning/eclair',
    logo: eclairLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'eclair',
    command: [
      'polar-eclair',
      '--node-alias={{name}}',
      '--server.public-ips.0={{name}}',
      '--server.port=9735',
      '--api.enabled=true',
      '--api.binding-ip=0.0.0.0',
      '--api.port=8080',
      '--api.password={{eclairPass}}',
      '--chain=regtest',
      '--bitcoind.host={{backendName}}',
      '--bitcoind.rpcport=18443',
      '--bitcoind.rpcuser={{rpcUser}}',
      '--bitcoind.rpcpassword={{rpcPass}}',
      '--bitcoind.zmqblock=tcp://{{backendName}}:28334',
      '--bitcoind.zmqtx=tcp://{{backendName}}:28335',
      '--datadir=/home/eclair/.eclair',
      '--printToConsole=true',
      '--on-chain-fees.feerate-tolerance.ratio-low=0.00001',
      '--on-chain-fees.feerate-tolerance.ratio-high=10000.0',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['name', 'eclairPass', 'backendName', 'rpcUser', 'rpcPass'],
  },
  bitcoind: {
    name: 'Bitcoin Core',
    imageName: 'polarlightning/bitcoind',
    logo: bitcoindLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'bitcoind',
    command: [
      'bitcoind',
      '-server=1',
      '-regtest=1',
      '-rpcauth={{rpcUser}}:{{rpcAuth}}',
      '-debug=1',
      '-zmqpubrawblock=tcp://0.0.0.0:28334',
      '-zmqpubrawtx=tcp://0.0.0.0:28335',
      '-txindex=1',
      '-dnsseed=0',
      '-upnp=0',
      '-rpcbind=0.0.0.0',
      '-rpcallowip=0.0.0.0/0',
      '-rpcport=18443',
      '-rest',
      '-listen=1',
      '-listenonion=0',
      '-fallbackfee=0.0002',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['rpcUser', 'rpcAuth'],
  },
  btcd: {
    name: 'btcd',
    imageName: '',
    logo: '',
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'btcd',
    command: '',
    variables: [],
  },
};

/**
 * The URL containing the metadata for the images available on Docker Hub. If the contents of
 * this URL is newer than the state defined below, then the user can update their local list of
 * images and use new versions without needing to update the Polar app
 */
export const REPO_STATE_URL =
  'https://raw.githubusercontent.com/jamaljsr/polar/master/docker/nodes.json';

/**
 * this defines the hard-coded list of docker images available in the Polar app. When new images
 * are pushed to Docker Hub, this list should be updated along with the /docker/nodes.json file.
 */
export const defaultRepoState: DockerRepoState = {
  version: 35,
  images: {
    LND: {
      latest: '0.14.2-beta',
      versions: [
        '0.14.2-beta',
        '0.14.1-beta',
        '0.13.1-beta',
        '0.13.0-beta',
        '0.12.1-beta',
        '0.11.1-beta',
        '0.10.3-beta',
      ],
      // not all LND versions are compatible with all bitcoind versions.
      // this mapping specifies the highest compatible bitcoind for each LND version
      compatibility: {
        '0.14.2-beta': '22.0',
        '0.14.1-beta': '22.0',
        '0.13.1-beta': '22.0',
        '0.13.0-beta': '22.0',
        '0.12.1-beta': '22.0',
        '0.11.1-beta': '22.0',
        '0.10.3-beta': '22.0',
      },
    },
    'c-lightning': {
      latest: '0.10.0',
      versions: ['0.10.0', '0.9.3', '0.8.2'],
    },
    eclair: {
      latest: '0.6.1',
      versions: ['0.6.1', '0.6.0', '0.5.0', '0.4.2'],
    },
    bitcoind: {
      latest: '22.0',
      versions: ['22.0', '0.21.1'],
    },
    btcd: {
      latest: '',
      versions: [],
    },
  },
};
