// Docker
export const DOCKER_REPO = 'polarlightning';

// bitcoind
export const BLOCKS_TIL_COMFIRMED = 6;
export const COINBASE_MATURITY_HEIGHT = 100;

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
