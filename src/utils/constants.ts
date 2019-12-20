import { DockerConfig, NodeImplementation } from 'shared/types';

// Docker
export const DOCKER_REPO = 'polarlightning';

// bitcoind
export const INITIAL_BLOCK_REWARD = 50;
export const BLOCKS_TIL_COMFIRMED = 6;
export const COINBASE_MATURITY_DELAY = 100;
// https://github.com/bitcoin/bitcoin/blob/v0.19.0.1/src/chainparams.cpp#L258
export const HALVING_INTERVAL = 150;

// designer chart
export const LOADING_NODE_ID = 'loading_id';

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
  },
  lnd: {
    rest: 8081,
    grpc: 10001,
  },
  clightning: {
    rest: 8181,
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
    volumeDirName: 'lnd',
  },
  'c-lightning': {
    volumeDirName: 'c-lightning',
    dataDir: 'lightningd',
    apiDir: 'rest-api',
  },
  eclair: {
    volumeDirName: 'eclair',
  },
  bitcoind: {
    volumeDirName: 'bitcoind',
  },
  btcd: {
    volumeDirName: 'btcd',
  },
};
