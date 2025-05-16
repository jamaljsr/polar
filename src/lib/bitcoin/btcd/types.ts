export interface GetBlockchainInfoResponse {
  jsonrpc: string;
  result: {
    chain: string;
    blocks: number;
    headers: number;
    bestblockhash: string;
    difficulty: number;
    mediantime: number;
    pruned: boolean;
    bip9_softforks: {
      [key: string]: {
        status: string;
        bit: number;
        startTime: number;
        start_time: number;
        timeout: number;
        since: number;
        min_activation_height: number;
      };
    };
  };
  error: null | {
    code: number;
    message: string;
  };
  id: string;
}

export interface GetInfoResponse {
  jsonrpc: string;
  result: {
    version: number;
    protocolversion: number;
    walletversion: number;
    balance: number;
    blocks: number;
    timeoffset: number;
    connections: number;
    proxy: string;
    difficulty: number;
    testnet: boolean;
    keypoololdest: number;
    keypoolsize: number;
    unlocked_until: number;
    paytxfee: number;
    relayfee: number;
    errors: string;
  };
  error: null | {
    code: number;
    message: string;
  };
  id: string;
}

export interface GetNewAddressResponse {
  jsonrpc: string;
  result: string;
  error: null | {
    code: number;
    message: string;
  };
  id: string;
}

export interface SendToAddressResponse {
  jsonrpc: string;
  result: string;
  error: null | {
    code: number;
    message: string;
  };
  id: string;
}

export interface Transaction {
  abandoned: boolean;
  account: string;
  address: string;
  amount: number;
  category: 'send' | 'receive' | 'immature' | 'generate' | 'orphan';
  confirmations: number;
  fee?: number;
  time: number;
  timereceived: number;
  trusted: boolean;
  txid: string;
  vout: number;
  walletconflicts: string[];
  blockhash?: string;
  blocktime?: number;
  generated?: boolean;
}

export interface ListTransactionsResponse {
  jsonrpc: string;
  result: Transaction[];
  error: null | {
    code: number;
    message: string;
  };
  id: string;
}
