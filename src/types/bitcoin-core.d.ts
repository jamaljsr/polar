// Type definitions for bitcoin-core 5.0.0
// Project: https://github.com/ruimarinho/bitcoin-core
// Definitions by: Joe Miyamoto <joemphilps@gmail.com>
// Modified by: @jamaljsr
// https://github.com/ruimarinho/bitcoin-core/pull/65
// Updated for Bitcoin Core 27.0+ compatibility

// Type definitions for Bitcoin Core RPC methods and responses

interface Requester {
  unsupported?: any[];
  version?: any;
}

interface Parser {
  headers: boolean;
}

type ScriptDecoded = {
  asm: string;
  hex: string;
  type: string;
  reqSigs: number;
  addresses: string[];
  ps2h?: string;
};
type FundRawTxOptions = {
  changeAddress?: string;
  chnagePosition?: number;
  includeWatching?: boolean;
  lockUnspents?: boolean;
  feeRate?: number;
  subtractFeeFromOutputs?: number[];
  replaceable?: boolean;
  conf_target?: number;
  estimate_mode: FeeEstimateMode;
};

type FeeEstimateMode = 'UNSET' | 'ECONOMICAL' | 'CONSERVATIVE';

type TxStats = {
  time: number;
  txcount: number;
  window_final_block_hash?: string;
  window_block_count?: number;
  window_tx_count?: number;
  window_interval?: number;
  txrate: number;
};

type AddedNodeInfo = {
  addednode: string;
  connected: boolean;
  addresses: {
    address: string;
    connected: 'inbound' | 'outbound';
  }[];
};

type MemoryStats = {
  locked: {
    used: number;
    free: number;
    total: number;
    locked: number;
    chunks_used: number;
    chunks_free: number;
  };
};

type NetworkInfo = {
  version: number;
  subversion: string;
  protocolversion: number;
  localservices: string;
  localrelay: boolean;
  timeoffset: number;
  connections: number;
  networkactive: boolean;
  networks: {
    name: string;
    limited: boolean;
    reachable: boolean;
    proxy: string;
    proxy_randomize_credentials: boolean;
  }[];
  relayfee: number;
  incrementalfee: number;
  localaddresses: {
    address: string;
    port: number;
    score: number;
  }[];
  warnings?: string;
};

type PeerInfo = {
  id: number;
  addr: string;
  addrbind: string;
  addrlocal: string;
  services: string;
  relaytxs: boolean;
  lastsend: number;
  lastrecv: number;
  bytessent: number;
  bytesrecv: number;
  conntime: number;
  timeoffset: number;
  pingtime: number;
  minping: number;
  version: number;
  subver: string;
  inbound: boolean;
  addnode: boolean;
  startinheight: number;
  banscore: number;
  synced_headers: number;
  synced_blocks: number;
  inflight: number[];
  whitelisted: boolean;
  bytessent_per_msg: {
    [key: string]: number;
  };
  byterecv_per_msg: {
    [key: string]: number;
  };
};

type NetTotals = {
  totalbytesrecv: number;
  totalbytessent: number;
  timemlillis: number;
  uploadtarget: {
    timeframe: number;
    target: number;
    target_reached: boolean;
    save_historical_blocks: boolean;
    bytes_left_in_cycle: number;
    time_lef_in_cycle: number;
  };
};

type ChainInfo = {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: boolean;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
  pruneheight: number;
  automatic_pruning: boolean;
  prune_target_size: number;
  softforks: {
    id: string;
    version: number;
    reject: {
      status: boolean;
    };
  }[];
  bip9_softforks: {
    [key: string]: {
      status: 'defined' | 'started' | 'locked_in' | 'active' | 'failed';
    };
  }[];
  warnings?: string;
};
type ChainTip = {
  height: number;
  hash: string;
  branchlen: number;
  status: 'active' | 'valid-fork' | 'valid-headers' | 'headers-only' | 'invalid';
};
type Outpoint = { id: string; index: number };
type UTXO = {
  height: number;
  value: number;
  scriptPubkey: {
    asm: string;
    hex: string;
    reqSigs: number;
    type: string;
    addresses: string[];
  };
};

type UnspentTxInfo = {
  txid: string;
  vout: number;
  address: string;
  acount: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  redeemScript: string;
  spendable: boolean;
  solvable: boolean;
  safe: boolean;
};

type PrevOut = {
  txid: string;
  vout: number;
  scriptPubKey: string;
  redeemScript?: string;
  amount: number;
};

type UTXOStats = {
  height: number;
  bestblock: string;
  transactions: number;
  txouts: number;
  bogosize: number;
  hash_serialized_2: string;
  disk_size: number;
  total_amount: number;
};
type MempoolContent = {
  [key: string]: {
    size: number;
    fee: number;
    modifiedfee: number;
    time: number;
    height: number;
    descendantcount: number;
    descendantsize: number;
    descendantfees: number;
    ancestorcount: number;
    ancestorsize: number;
    ancestorfees: number;
    wtxid: string;
    depends: string[];
  };
};

type DecodedRawTransaction = {
  txid: string;
  hash: string;
  size: number;
  vsize: number;
  version: number;
  locktime: number;
  vin: TxIn[];
  vout: TxOut[];
};

interface FetchedRawTransaction extends DecodedRawTransaction {
  hex: string;
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
}

type MiningInfo = {
  blocks: number;
  currentblockweight: number;
  currentblocktx: number;
  difficulty: number;
  networkhashps: number;
  pooledtx: number;
  chain: 'main' | 'test' | 'regtest';
  warnings?: string;
};

type MempoolInfo = {
  size: number;
  bytes: number;
  usage: number;
  maxmempol: number;
  mempoolminfee: number;
  minrelaytxfee: number;
};
type BlockHeader = {
  hash: string;
  confirmations: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  previoutsblockchash: string;
};
type Block = {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  verxionHex: string;
  merkleroot: string;
  tx: Transaction[] | string;
  hex: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  previousblockhash: string;
  nextblockchash?: string;
};
type Transaction = {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  locktime: number;
  vin: TxIn[];
  vout: TxOut[];
};

type TxIn = {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  txinwitness?: string[];
  sequence: number;
};

type TxInForCreateRaw = {
  txid: string;
  vout: number;
  sequence?: number;
};

type TxOut = {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs: number;
    type: scriptPubkeyType;
    addresses: string[];
  };
};

type TxOutForCreateRaw = {
  address: string;
  data: string;
};

type TxOutInBlock = {
  bestblock: string;
  confirmations: number;
  value: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs: number;
    type: scriptPubkeyType;
    addresses: string[];
  };
  coinbase: boolean;
};

type DecodedScript = {
  asm: string;
  hex: string;
  type: string;
  reqSigs: number;
  addresses: string[];
  p2sh: string;
};

type WalletTransaction = {
  amount: number;
  fee: number;
  confirmations: number;
  blockhash: string;
  blockindex: number;
  blocktime: number;
  txid: string;
  time: number;
  timereceived: number;
  'bip125-replaceable': 'yes' | 'no' | 'unknown';
  details: {
    account: string;
    address: string;
    category: 'send' | 'receive';
    amount: number;
    label?: string;
    vout: number;
    fee: number;
    abandoned: number;
  }[];
  hex: string;
};

type WalletInfo = {
  walletname: string;
  walletversion: number;
  txcount: number;
  keypoololdest: number;
  keypoolsize: number;
  paytxfee: number;
  hdmasterkeyid: string;
};

// This is a compatibility type for the WalletInfo type in bitcoind v30. This includes
// the balance fields that were deprecated in favor of the getBalances method. We use
// in the BitcoinService.getWalletInfo method to return the legacy balance fields,
// avoiding a large refactoring effort.
type WalletInfoCompat = WalletInfo & {
  balance: number;
  unconfirmed_balance: number;
  immature_balance: number;
};

type scriptPubkeyType = string;

type SigHashType =
  | 'ALL'
  | 'NONE'
  | 'SINGLE'
  | 'ALL|ANYONECANPAY'
  | 'NONE|ANYONECANPAY'
  | 'SINGLE|ANYONECANPAY';

type SignRawTxResult = {
  hex: string;
  complete: boolean;
  errors?: {
    txid: string;
    vout: number;
    scriptSig: string;
    sequence: number;
    error: string;
  }[];
};

type ValidateAddressResult = {
  isvalid: boolean;
  address?: string;
  scriptPubKey?: string;
  ismine?: boolean;
  iswatchonly?: boolean;
  isscript?: boolean;
  script?: string;
  hex?: string;
  addresses?: string[];
  sigsrequired?: number;
  pubkey?: string;
  iscompressed?: boolean;
  account?: string;
  timestamp?: number;
  hdkeypath?: string;
  hdmasterkeyid?: string;
};

type ImportMultiRequest = {
  scriptPubKey: string | { address: string };
  timestamp: number | 'now';
  redeemScript?: string;
  pubkeys?: string[];
  keys?: string[];
  internal?: boolean;
  watchonly?: boolean;
  label?: string;
};

type Received = {
  involvesWatchonly?: boolean;
  account: string;
  amount: number;
  confirmations: number;
  label: string;
};

type ListUnspentOptions = {
  minimumAmount: number | string;
  maximumAmount: number | string;
  maximumCount: number | string;
  minimumSumAmount: number | string;
};

type ReceivedByAccount = Received;

type ReceivedByAddress = {
  address: string;
  txids: string[];
} & Received;

type RestExtension = 'json' | 'bin' | 'hex';

type PsbtInput = {
  [key: string]: any;
};

type PsbtOutput = {
  [key: string]: any;
};

type PsbtAnalyzeResult = {
  inputs: {
    has_utxo: boolean;
    is_final: boolean;
    missing: {
      pubkeys: string[];
      signatures: string[];
      redeemscript?: string;
      witnessscript?: string;
    };
    next: string;
  }[];
  estimated_vsize?: number;
  estimated_feerate?: number;
  fee?: number;
  next: string;
};

type DescriptorInfo = {
  descriptor: string;
  checksum: string;
  isrange: boolean;
  issolvable: boolean;
  hasprivatekeys: boolean;
};

type ScanTxOutSetResult = {
  success: boolean;
  txouts: number;
  height: number;
  bestblock: string;
  unspents: UnspentTxInfo[];
  total_amount: number;
};

type EnumerateSignersResult = {
  signers: any[];
};

type IndexInfo = {
  [key: string]: {
    synced: boolean;
    best_block_height: number;
  };
};

type RpcInfo = {
  active_commands: {
    method: string;
    duration: number;
  }[];
};

type ChainState = {
  [key: string]: any;
};

type DeploymentInfo = {
  [key: string]: {
    type: string;
    height: number;
    active: boolean;
    hash?: string;
  };
};

type BalanceInfo = {
  trusted: number;
  untrusted_pending: number;
  immature: number;
};

type GetBalancesResult = {
  mine: BalanceInfo;
  watchonly?: BalanceInfo;
};

type GetBlockFilterResult = {
  filter: string;
  header: string;
};

type GetTxSpendingPrevOutResult = {
  txid: string;
  vout: number;
  spendingtxid?: string;
};

type ImportDescriptorResult = {
  success: boolean;
  error?: any;
};

type ListDescriptorsResult = {
  wallet_name: string;
  descriptors: any[];
};

type ListWalletDirResult = {
  name: string;
};

type LoadTxOutSetResult = {
  coins_loaded: number;
  tip_hash: string;
  base_height: number;
  path: string;
};

type LoadWalletResult = {
  name: string;
  warning: string;
};

type LoggingResult = {
  [key: string]: boolean;
};

type PsbtBumpFeeResult = {
  psbt: string;
  origfee: number;
  fee: number;
  error?: string[];
};

type RescanBlockchainResult = {
  start_height: number;
  stop_height: number;
};

type RestoreWalletResult = {
  name: string;
  warning: string;
};

type SendResult = {
  txid: string;
  fee: number;
  change: string;
  change_pos: number;
};

type SetWalletFlagResult = {
  flag_name: string;
  flag_state: boolean;
  warnings: string;
};

type TestMempoolAcceptResult = {
  txid: string;
  allowed: boolean;
  'reject-reason'?: string;
};

type UpgradeWalletResult = {
  result: string;
};

type WalletCreateFundedPsbtResult = {
  psbt: string;
  fee: number;
  changepos: number;
};

type WalletDisplayAddressResult = {
  address: string;
};

type BumpFeeResult = {
  txid: string;
  origfee: number;
  fee: number;
  error?: string[];
};

type CreateMultiSigResult = {
  address: string;
  redeemScript: string;
};

type CreateWalletResult = {
  name: string;
  warning: string;
};

type EstimateSmartFeeResult = {
  feerate?: number;
  errors?: string[];
  blocks?: number;
};

type FundRawTransactionResult = {
  hex: string;
  fee: number;
  changepos: number;
};

type ImportMultiResult = {
  success: boolean;
  error?: { code: string; message: string };
};

type ListAccountsResult = {
  [key: string]: number;
};

type SignMessageWithPrivKeyResult = {
  signature: string;
};

type UnspentTransactionOutputsResult = {
  chainHeight: number;
  chaintipHash: string;
  bipmap: string;
  utxos: UTXO[];
};

type ListLockUnspentResult = {
  txid: string;
  vout: number;
};

type DumpTxOutsetResult = {
  coins_written: number;
};

type FinalizePsbtResult = {
  psbt?: string;
  hex?: string;
  complete: boolean;
};

type PsbtProcessResult = {
  psbt: string;
  complete: boolean;
};

type DumpWalletResult = {
  filename: string;
};

type GetAddressesByLabelResult = {
  [address: string]: any;
};

export type MethodNameInLowerCase =
  | 'abandontransaction'
  | 'abortrescan'
  | 'addmultisigaddress'
  | 'addnode'
  | 'addwitnessaddress'
  | 'analyzepsbt'
  | 'backupwallet'
  | 'bumpfee'
  | 'clearbanned'
  | 'combinepsbt'
  | 'combinerawtransaction'
  | 'converttopsbt'
  | 'createmultisig'
  | 'createpsbt'
  | 'createrawtransaction'
  | 'createwallet'
  | 'createwalletdescriptor'
  | 'createwitnessaddress'
  | 'decodepsbt'
  | 'decoderawtransaction'
  | 'decodescript'
  | 'deriveaddresses'
  | 'descriptorprocesspsbt'
  | 'disconnectnode'
  | 'dumpprivkey'
  | 'dumptxoutset'
  | 'dumpwallet'
  | 'encryptwallet'
  | 'enumeratesigners'
  | 'estimatefee'
  | 'estimatepriority'
  | 'estimatesmartfee'
  | 'estimatesmartpriority'
  | 'finalizepsbt'
  | 'fundrawtransaction'
  | 'generate'
  | 'generatetoaddress'
  | 'generatetodescriptor'
  | 'getaccount'
  | 'getaccountaddress'
  | 'getaddednodeinfo'
  | 'getaddrmaninfo'
  | 'getaddressinfo'
  | 'getaddressesbyaccount'
  | 'getaddressesbylabel'
  | 'getbalance'
  | 'getbalances'
  | 'getbestblockhash'
  | 'getblock'
  | 'getblockcount'
  | 'getblockfilter'
  | 'getblockfrompeer'
  | 'getblockhash'
  | 'getblockheader'
  | 'getblockstats'
  | 'getblocktemplate'
  | 'getblockchaininfo'
  | 'getchainstates'
  | 'getchaintips'
  | 'getchaintxstats'
  | 'getconnectioncount'
  | 'getdeploymentinfo'
  | 'getdescriptorinfo'
  | 'getdifficulty'
  | 'getgenerate'
  | 'gethashespersec'
  | 'gethdkeys'
  | 'getindexinfo'
  | 'getinfo'
  | 'getmemoryinfo'
  | 'getmempoolancestors'
  | 'getmempooldescendants'
  | 'getmempoolentry'
  | 'getmempoolinfo'
  | 'getmininginfo'
  | 'getnettotals'
  | 'getnetworkhashps'
  | 'getnetworkinfo'
  | 'getnewaddress'
  | 'getnodeaddresses'
  | 'getpeerinfo'
  | 'getprioritisedtransactions'
  | 'getrawchangeaddress'
  | 'getrawmempool'
  | 'getrawtransaction'
  | 'getreceivedbyaccount'
  | 'getreceivedbyaddress'
  | 'getreceivedbylabel'
  | 'getrpcinfo'
  | 'gettransaction'
  | 'gettxout'
  | 'gettxoutproof'
  | 'gettxoutsetinfo'
  | 'gettxspendingprevout'
  | 'getunconfirmedbalance'
  | 'getwalletinfo'
  | 'getwork'
  | 'getzmqnotifications'
  | 'help'
  | 'importaddress'
  | 'importdescriptors'
  | 'importmempool'
  | 'importmulti'
  | 'importprivkey'
  | 'importprunedfunds'
  | 'importpubkey'
  | 'importwallet'
  | 'joinpsbts'
  | 'keypoolrefill'
  | 'listaccounts'
  | 'listaddressgroupings'
  | 'listbanned'
  | 'listdescriptors'
  | 'listlabels'
  | 'listlockunspent'
  | 'listreceivedbyaccount'
  | 'listreceivedbyaddress'
  | 'listreceivedbylabel'
  | 'listsinceblock'
  | 'listtransactions'
  | 'listunspent'
  | 'listwalletdir'
  | 'listwallets'
  | 'loadtxoutset'
  | 'loadwallet'
  | 'lockunspent'
  | 'logging'
  | 'migratewallet'
  | 'move'
  | 'newkeypool'
  | 'ping'
  | 'preciousblock'
  | 'prioritisetransaction'
  | 'pruneblockchain'
  | 'psbtbumpfee'
  | 'removeprunedfunds'
  | 'rescanblockchain'
  | 'restorewallet'
  | 'savemempool'
  | 'scanblocks'
  | 'scantxoutset'
  | 'send'
  | 'sendall'
  | 'sendfrom'
  | 'sendmany'
  | 'sendrawtransaction'
  | 'sendtoaddress'
  | 'setaccount'
  | 'setban'
  | 'setgenerate'
  | 'sethdseed'
  | 'setlabel'
  | 'setnetworkactive'
  | 'settxfee'
  | 'setwalletflag'
  | 'signmessage'
  | 'signmessagewithprivkey'
  | 'signrawtransaction'
  | 'signrawtransactionwithkey'
  | 'signrawtransactionwithwallet'
  | 'simulaterawtransaction'
  | 'stop'
  | 'submitblock'
  | 'submitheader'
  | 'submitpackage'
  | 'testmempoolaccept'
  | 'unloadwallet'
  | 'uptime'
  | 'upgradewallet'
  | 'utxoupdatepsbt'
  | 'validateaddress'
  | 'verifychain'
  | 'verifymessage'
  | 'verifytxoutproof'
  | 'walletcreatefundedpsbt'
  | 'walletdisplayaddress'
  | 'walletlock'
  | 'walletpassphrase'
  | 'walletpassphrasechange'
  | 'walletprocesspsbt';

type BatchOption = {
  method: MethodNameInLowerCase;
  parameters: any;
};
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

type BumpFeeOption = {
  confTarget?: number;
  totalFee?: number;
  replaceable?: boolean;
  estimate_mode?: FeeEstimateMode;
};

type WalletTxBase = {
  account: string;
  address: string;
  category: 'send' | 'receive';
  amount: number;
  vout: number;
  fee: number;
  confirmations: number;
  blockhash: string;
  blockindex: number;
  blocktime: number;
  txid: string;
  time: number;
  timereceived: number;
  walletconflicts: string[];
  'bip125-replaceable': 'yes' | 'no' | 'unknown';
  abandoned?: boolean;
  comment?: string;
  label: string;
  to?: string;
};

type TransactionInListSinceBlock = WalletTxBase;

type ListSinceBlockResult = {
  transactions: TransactionInListSinceBlock[];
  removed?: TransactionInListSinceBlock[];
  lastblock: string;
};

type ListTransactionsResult = {
  trusted: boolean;
  otheraccount?: string;
  abandoned?: boolean;
} & WalletTxBase;

type AddressGrouping = [string, number] | [string, number, string];

export default class Client {
  private readonly request: any;
  private readonly requests: Requester;
  private readonly parser: Parser;

  constructor(clientOption?: ClientConstructorOption);

  abandonTransaction(txid: string): Promise<void>;

  abortRescan(): Promise<void>;

  addMultiSigAddress(
    nrequired: number,
    keys: string[],
    account?: string,
  ): Promise<string>;

  addNode(node: string, command: 'add' | 'remove' | 'onentry'): Promise<void>;

  addWitnessAddress(address: string): Promise<void>;

  backupWallet(destination: string): Promise<void>;

  bumpFee(txid: string, options?: BumpFeeOption): Promise<BumpFeeResult>;

  clearBanned(): Promise<void>;

  combineRawTransaction(txs: string[]): Promise<string>;

  command<R extends ReturnType<keyof Client>>(
    methods: BatchOption[],
  ): Promise<ReadonlyArray<R>>;

  createMultiSig(nrequired: number, keys: string[]): Promise<CreateMultiSigResult>;

  createRawTransaction(
    inputs: TxInForCreateRaw[],
    outputs: TxOutForCreateRaw,
    locktime: number,
    replacable: boolean,
  ): Promise<string>;

  createWallet(
    wallet_name: string,
    disable_private_keys?: boolean,
    blank?: boolean,
    passphrase?: string,
    avoid_reuse?: boolean,
    descriptors?: boolean,
    load_on_startup?: boolean,
  ): Promise<CreateWalletResult>;

  /**
   * @deprecated
   */
  createWitnessAddress(...args: any[]): void;

  decodeRawTransaction(hexstring: string): Promise<DecodedRawTransaction>;

  decodeScript(hexstring: string): Promise<ScriptDecoded>;

  disconnectNode(address?: string, nodeid?: number): Promise<void>;

  dumpPrivKey(address: string): Promise<string>;

  dumpWallet(filename: string): Promise<DumpWalletResult>;

  encryptWallet(passphrase: string): Promise<void>;

  estimateFee(nblock: number): Promise<number>;

  /**
   * @deprecated
   */
  estimatePriority(...args: any[]): void;

  estimateSmartFee(
    conf_target: number,
    estimate_mode?: FeeEstimateMode,
  ): Promise<EstimateSmartFeeResult>;

  /**
   * @deprecated
   */
  estimateSmartPriority(...args: any[]): void;

  fundRawTransaction(
    hexstring: string,
    options: FundRawTxOptions,
  ): Promise<FundRawTransactionResult>;

  generate(nblocks: number, maxtries?: number): Promise<string[]>;

  generateToAddress(
    nblock: number,
    address: string,
    maxtries?: number,
  ): Promise<string[]>;

  /**
   * @deprecated
   * @param {string} address
   * @returns {Promise<string>}
   */
  getAccount(address: string): Promise<string>;

  /**
   * @deprecated
   * @param {string} account
   * @returns {Promise<string>}
   */
  getAccountAddress(account: string): Promise<string>;

  getAddedNodeInfo(node?: string): Promise<AddedNodeInfo[]>;

  /**
   * @deprecated
   * @param {string} account
   * @returns {Promise<string[]>}
   */
  getAddressesByAccount(account: string): Promise<string[]>;

  getBalance(
    account?: string,
    minconf?: number,
    include_watchonly?: boolean,
  ): Promise<number>;

  getBestBlockHash(): Promise<string>;

  getBlock(blockhash: string, verbosity?: number): Promise<string | Block>;

  getBlockByHash(hash: string, extension: RestExtension): Promise<Block>;

  getBlockCount(): Promise<number>;

  getBlockHash(height: number): Promise<string>;

  getBlockHeader(hash: string, verbose?: boolean): Promise<string | BlockHeader>;

  getBlockHeadersByHash(hash: string, extension: RestExtension): Promise<BlockHeader[]>;

  getBlockTemplate(...args: any[]): void;

  getBlockchainInfo(): Promise<ChainInfo>;

  getBlockchainInformation(): Promise<ChainInfo>;

  getChainTips(): Promise<ChainTip[]>;

  getChainTxStats(nblocks?: number, blockchash?: string): Promise<TxStats>;

  getConnectionCount(): Promise<number>;

  getDifficulty(): Promise<number>;

  /**
   * @deprecated
   */
  getGenerate(...args: any[]): void;

  /**
   * @deprecated
   */
  getHashesPerSec(...args: any[]): void;

  /**
   * @deprecated
   */
  getInfo(...args: any[]): void;

  getMemoryInfo(mode?: 'stats' | 'mallocinfo'): Promise<MemoryStats | string>;

  getMemoryPoolContent(): Promise<MempoolContent>;

  getMemoryPoolInformation(): Promise<MempoolInfo>;

  getMempoolAncestors(
    txid: string,
    verbose?: boolean,
  ): Promise<MempoolContent[] | string[] | null[]>;

  getMempoolDescendants(
    txid: string,
    verbose?: boolean,
  ): Promise<MempoolContent[] | string[] | null[]>;

  getMempoolEntry(txid: string): Promise<MempoolContent>;

  getMempoolInfo(): Promise<MempoolInfo>;

  getMiningInfo(): Promise<MiningInfo>;

  getNetTotals(): Promise<NetTotals>;

  getNetworkHashPs(nblocks?: number, height?: number): Promise<number>;

  getNetworkInfo(): Promise<NetworkInfo>;

  getNewAddress(account?: string): Promise<string>;

  getPeerInfo(): Promise<PeerInfo[]>;

  getRawChangeAddress(): Promise<string>;

  getRawMempool(verbose?: boolean): Promise<MempoolContent[] | string[] | null[]>;

  getRawTransaction(
    txid: string,
    verbose?: boolean,
  ): Promise<FetchedRawTransaction | string>;

  /**
   * @deprecated
   * @param {string} account
   * @param {number} minconf
   * @returns {Promise<number>}
   */
  getReceivedByAccount(account: string, minconf?: number): Promise<number>;

  getReceivedByAddress(address: string, minconf?: number): Promise<number>;

  getTransaction(txid: string, include_watchonly?: boolean): Promise<WalletTransaction>;

  getTransactionByHash(hash: string, extension?: RestExtension): Promise<string>;

  getTxOut(txid: string, index: number, include_mempool?: boolean): Promise<TxOutInBlock>;

  getTxOutProof(txids: string[], blockchash?: string): Promise<string>;

  getTxOutSetInfo(): Promise<UTXOStats>;

  getUnconfirmedBalance(): Promise<number>;

  getUnspentTransactionOutputs(
    outpoints: Outpoint[],
  ): Promise<UnspentTransactionOutputsResult>;

  getWalletInfo(): Promise<WalletInfo>;

  /**
   * @deprecated
   */
  getWork(...args: any[]): void;

  help(arg: void | MethodNameInLowerCase): Promise<string>;

  importAddress(
    script: string,
    label?: string,
    rescan?: boolean,
    p2sh?: boolean,
  ): Promise<void>;

  importMulti(
    requests: ImportMultiRequest[],
    options?: { rescan?: boolean },
  ): Promise<ImportMultiResult[]>;

  importPrivKey(bitcoinprivkey: string, label?: string, rescan?: boolean): Promise<void>;

  importPrunedFunds(rawtransaction: string, txoutproof: string): Promise<void>;

  importPubKey(pubkey: string, label?: string, rescan?: boolean): Promise<void>;

  importWallet(filename: string): Promise<void>;

  keypoolRefill(newsize?: number): Promise<void>;

  listAccounts(
    minconf?: number,
    include_watchonlly?: boolean,
  ): Promise<ListAccountsResult>;

  listAddressGroupings(): Promise<AddressGrouping[][]>;

  listBanned(): Promise<any>;

  listLockUnspent(): Promise<ListLockUnspentResult[]>;

  listReceivedByAccount(
    minconf?: number,
    include_empty?: boolean,
    include_watchonly?: boolean,
  ): Promise<ReceivedByAccount[]>;

  listReceivedByAddress(
    minconf?: number,
    include_empty?: boolean,
    include_watchonly?: boolean,
  ): Promise<ReceivedByAddress[]>;

  listSinceBlock(
    blockhash?: string,
    target_confirmations?: number,
    include_watchonly?: boolean,
    include_removed?: boolean,
  ): Promise<ListSinceBlockResult>;

  listTransactions(
    account?: string,
    count?: number,
    skip?: number,
    include_watchonly?: boolean,
  ): Promise<ListTransactionsResult[]>;

  listUnspent(
    minconf?: number,
    maxconf?: number,
    address?: string[],
    include_unsafe?: boolean,
    query_options?: ListUnspentOptions,
  ): Promise<UnspentTxInfo[]>;

  listWallets(): Promise<string[]>;

  lockUnspent(
    unlock: boolean,
    transactions?: { txid: string; vout: number }[],
  ): Promise<boolean>;

  /**
   * @deprecated
   * @param {string} fromaccout
   * @param {string} toaccount
   * @param {number} amount
   * @param {number} dummy
   * @param {string} comment
   * @returns {Promise<boolean>}
   */
  move(
    fromaccout: string,
    toaccount: string,
    amount: number,
    dummy?: number,
    comment?: string,
  ): Promise<boolean>;

  ping(): Promise<void>;

  preciousBlock(blockhash: string): Promise<void>;

  prioritiseTransaction(txid: string, dummy: 0, fee_delta: number): Promise<boolean>;

  pruneBlockchain(height: number): Promise<number>;

  removePrunedFunds(txid: string): Promise<void>;

  /**
   * @deprecated
   * @param {string} fromaccount
   * @param {string} toaddress
   * @param {number | string} amount
   * @param {number} minconf
   * @param {string} comment
   * @param {string} comment_to
   * @returns {Promise<string>}
   */
  sendFrom(
    fromaccount: string,
    toaddress: string,
    amount: number | string,
    minconf?: number,
    comment?: string,
    comment_to?: string,
  ): Promise<string>;

  sendMany(
    fromaccount: string,
    amounts: { address: string },
    minconf?: number,
    comment?: string,
    subtractfeefrom?: string[],
    replaeable?: boolean,
    conf_target?: number,
    estimate_mode?: FeeEstimateMode,
  ): Promise<string>;

  sendRawTransaction(hexstring: string, allowhighfees?: boolean): Promise<void>;

  sendToAddress(
    address: string,
    amount: number,
    comment?: string,
    comment_to?: string,
    subtreactfeefromamount?: boolean,
    replaceable?: boolean,
    conf_target?: number,
    estimate_mode?: FeeEstimateMode,
  ): Promise<string>;

  /**
   * @deprecated
   * @param {string} address
   * @param {string} account
   * @returns {Promise<void>}
   */
  setAccount(address: string, account: string): Promise<void>;

  setBan(
    subnet: string,
    command: 'add' | 'remove',
    bantime?: number,
    absolute?: boolean,
  ): Promise<void>;

  /**
   * @deprecated
   * @param args
   */
  setGenerate(...args: any[]): void;

  setNetworkActive(state: boolean): Promise<void>;

  setTxFee(amount: number | string): Promise<boolean>;

  signMessage(address: string, message: string): Promise<string>;

  signMessageWithPrivKey(
    privkey: string,
    message: string,
  ): Promise<SignMessageWithPrivKeyResult>;

  signRawTransaction(
    hexstring: string,
    prevtxs?: PrevOut[],
    privkeys?: string[],
    sighashtype?: SigHashType,
  ): Promise<SignRawTxResult>;

  stop(): Promise<void>;

  submitBlock(hexdata: string, dummy?: any): Promise<void>;

  upTime(): Promise<number>;

  validateAddress(address: string): Promise<ValidateAddressResult>;

  verifyChain(checklevel?: number, nblocks?: number): Promise<boolean>;

  verifyMessage(address: string, signature: string, message: string): Promise<boolean>;

  verifyTxOutProof(proof: string): Promise<string[]>;

  walletLock(passphrase: string, timeout: number): Promise<void>;

  walletPassphrase(passphrase: string, timeout: number): Promise<void>;

  walletPassphraseChange(oldpassphrase: string, newpassphrase: string): Promise<string>;

  analyzePsbt(psbt: string): Promise<PsbtAnalyzeResult>;

  combinePsbt(txs: string[]): Promise<string>;

  convertToPsbt(hexstring: string): Promise<string>;

  createPsbt(
    inputs: TxInForCreateRaw[],
    outputs: TxOutForCreateRaw,
    locktime?: number,
    replacable?: boolean,
  ): Promise<string>;

  decodePsbt(psbt: string): Promise<any>;

  deriveAddresses(descriptor: string, range?: [number, number]): Promise<string[]>;

  descriptorProcessPsbt(
    psbt: string,
    descriptors?: string[],
    sighashtype?: SigHashType,
  ): Promise<PsbtProcessResult>;

  dumpTxOutset(filename: string): Promise<DumpTxOutsetResult>;

  enumerateSigners(wallet?: string): Promise<EnumerateSignersResult>;

  finalizePsbt(psbt: string, extract?: boolean): Promise<FinalizePsbtResult>;

  generateToDescriptor(
    num_blocks: number,
    descriptor: string,
    maxtries?: number,
  ): Promise<string[]>;

  getAddrManInfo(): Promise<any>;

  getAddressInfo(address: string): Promise<any>;

  getAddressesByLabel(label: string): Promise<GetAddressesByLabelResult>;

  getBalances(): Promise<GetBalancesResult>;

  getBlockFilter(blockhash: string, filtertype?: string): Promise<GetBlockFilterResult>;

  getBlockFromPeer(blockhash: string, peer_id: number): Promise<void>;

  getBlockStats(hash_or_height: string | number, stats?: string[]): Promise<any>;

  getChainStates(): Promise<ChainState[]>;

  getDeploymentInfo(): Promise<DeploymentInfo>;

  getDescriptorInfo(descriptor: string): Promise<DescriptorInfo>;

  getHdKeys(wallet?: string): Promise<any[]>;

  getIndexInfo(): Promise<IndexInfo>;

  getNodeAddresses(count?: number): Promise<any[]>;

  getPrioritisedTransactions(): Promise<any[]>;

  getReceivedByLabel(account: string, minconf?: number): Promise<number>;

  getRpcInfo(): Promise<RpcInfo>;

  getTxSpendingPrevOut(outpoints: Outpoint[]): Promise<GetTxSpendingPrevOutResult[]>;

  getZmqNotifications(): Promise<any[]>;

  importDescriptors(
    requests: any[],
    options?: { rescan?: boolean },
  ): Promise<ImportDescriptorResult[]>;

  importMempool(rawtx: string, options?: { fee?: number }): Promise<void>;

  joinPsbts(psbts: string[]): Promise<string>;

  listDescriptors(private?: boolean): Promise<ListDescriptorsResult>;

  listLabels(purpose?: string): Promise<string[]>;

  listReceivedByLabel(
    minconf?: number,
    include_empty?: boolean,
    include_watchonly?: boolean,
  ): Promise<ReceivedByAccount[]>;

  listWalletDir(): Promise<ListWalletDirResult[]>;

  loadTxOutSet(filename: string): Promise<LoadTxOutSetResult>;

  loadWallet(filename: string, load_on_startup?: boolean): Promise<LoadWalletResult>;

  logging(include?: string[], exclude?: string[]): Promise<LoggingResult>;

  migrateWallet(wallet?: string): Promise<void>;

  newKeyPool(): Promise<void>;

  psbtBumpFee(txid: string, options?: BumpFeeOption): Promise<PsbtBumpFeeResult>;

  rescanBlockchain(
    start_height?: number,
    stop_height?: number,
  ): Promise<RescanBlockchainResult>;

  restoreWallet(
    wallet_name: string,
    backup_file: string,
    load_on_startup?: boolean,
  ): Promise<RestoreWalletResult>;

  saveMempool(): Promise<void>;

  scanBlocks(
    scanobjects: string[],
    start_height?: number,
    stop_height?: number,
    filtertype?: string,
    options?: any,
  ): Promise<any>;

  scanTxOutSet(
    action: string,
    scanobjects: string[],
    options?: any,
  ): Promise<ScanTxOutSetResult>;

  send(
    outputs: any,
    conf_target?: number,
    estimate_mode?: FeeEstimateMode,
    fee_rate?: number,
    options?: any,
  ): Promise<SendResult>;

  sendAll(
    recipients: string[],
    conf_target?: number,
    estimate_mode?: FeeEstimateMode,
    fee_rate?: number,
    options?: any,
  ): Promise<SendResult>;

  setHdSeed(newkeypool?: boolean, seed?: string): Promise<void>;

  setLabel(address: string, label: string): Promise<void>;

  setWalletFlag(
    flag: string,
    value?: boolean,
    load_on_startup?: boolean,
  ): Promise<SetWalletFlagResult>;

  signRawTransactionWithKey(
    hexstring: string,
    privkeys?: string[],
    prevtxs?: PrevOut[],
    sighashtype?: SigHashType,
  ): Promise<SignRawTxResult>;

  signRawTransactionWithWallet(
    hexstring: string,
    prevtxs?: PrevOut[],
    sighashtype?: SigHashType,
  ): Promise<SignRawTxResult>;

  simulateRawTransaction(hexstring: string, options?: any): Promise<any>;

  submitHeader(hexdata: string): Promise<void>;

  submitPackage(package_hex: string[]): Promise<any[]>;

  testMempoolAccept(
    rawtxs: string[],
    allowhighfees?: boolean,
  ): Promise<TestMempoolAcceptResult[]>;

  unloadWallet(wallet?: string): Promise<void>;

  upgradeWallet(version: number): Promise<UpgradeWalletResult>;

  utxoUpdatePsbt(psbt: string, descriptors?: string[]): Promise<PsbtProcessResult>;

  walletCreateFundedPsbt(
    inputs?: TxInForCreateRaw[],
    outputs?: TxOutForCreateRaw,
    locktime?: number,
    options?: FundRawTxOptions,
    bip32derivs?: boolean,
  ): Promise<WalletCreateFundedPsbtResult>;

  walletDisplayAddress(address: string): Promise<WalletDisplayAddressResult>;

  walletProcessPsbt(
    psbt: string,
    sign?: boolean,
    sighashtype?: SigHashType,
    bip32derivs?: boolean,
  ): Promise<PsbtProcessResult>;
}

// Type alias for the extended Bitcoin Core client with all RPC methods
export type BitcoinCoreClient = Client;
