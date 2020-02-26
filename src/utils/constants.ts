import { NodeImplementation } from 'shared/types';
import { DockerConfig, DockerRepoState } from 'types';
import bitcoindLogo from 'resources/bitcoin.svg';
import clightningLogo from 'resources/clightning.png';
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
export const BasePorts = {
  bitcoind: {
    rest: 18443,
    zmqBlock: 28334,
    zmqTx: 29335,
  },
  lnd: {
    rest: 8081,
    grpc: 10001,
    p2p: 9735,
  },
  clightning: {
    rest: 8181,
    p2p: 9835,
  },
};

export const bitcoinCredentials = {
  user: 'polaruser',
  pass: 'polarpass',
  rpcauth:
    '5e5e98c21f5c814568f8b55d83b23c1c$$066b03f92df30b11de8e4b1b1cd5b1b4281aa25205bd57df9be82caf97a05526',
};

export const dockerConfigs: Record<NodeImplementation, DockerConfig> = {
  LND: {
    name: 'LND',
    logo: lndLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'lnd',
  },
  'c-lightning': {
    name: 'c-lightning',
    logo: clightningLogo,
    platforms: ['mac', 'linux'],
    volumeDirName: 'c-lightning',
    dataDir: 'lightningd',
    apiDir: 'rest-api',
  },
  eclair: {
    name: 'Eclair',
    logo: '',
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'eclair',
  },
  bitcoind: {
    name: 'Bitcoin Core',
    logo: bitcoindLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'bitcoind',
  },
  btcd: {
    name: 'btcd',
    logo: '',
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'btcd',
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
  version: 4,
  images: {
    LND: {
      latest: '0.9.0-beta',
      versions: ['0.9.0-beta', '0.8.2-beta', '0.8.0-beta', '0.7.1-beta'],
      // not all LND versions are compatible with all bitcoind versions.
      // this mapping specifies the highest compatible bitcoind for each LND version
      compatibility: {
        '0.9.0-beta': '0.19.0.1',
        '0.8.2-beta': '0.19.0.1',
        '0.8.0-beta': '0.18.1',
        '0.7.1-beta': '0.18.1',
      },
    },
    'c-lightning': {
      latest: '0.8.1',
      versions: ['0.8.1', '0.8.0'],
    },
    eclair: {
      latest: '',
      versions: [],
    },
    bitcoind: {
      latest: '0.19.0.1',
      versions: ['0.19.0.1', '0.18.1'],
    },
    btcd: {
      latest: '',
      versions: [],
    },
  },
};
