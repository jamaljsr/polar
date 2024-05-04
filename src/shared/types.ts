export enum Status {
  Starting,
  Started,
  Stopping,
  Stopped,
  Error,
}

export interface CommonNode {
  id: number;
  networkId: number;
  name: string;
  type: 'bitcoin' | 'lightning' | 'tap';
  version: string;
  status: Status;
  errorMsg?: string;
  docker: {
    image: string;
    command: string;
  };
}

export interface LightningNode extends CommonNode {
  type: 'lightning';
  implementation: 'LND' | 'c-lightning' | 'eclair';
  backendName: string;
  ports: Record<string, number | undefined>;
}

export interface LndNode extends LightningNode {
  paths: {
    tlsCert: string;
    adminMacaroon: string;
    invoiceMacaroon: string;
    readonlyMacaroon: string;
  };
  ports: {
    rest: number;
    grpc: number;
    p2p: number;
  };
}

export interface CLightningNode extends LightningNode {
  paths: {
    macaroon: string;
    tlsCert?: string;
    tlsClientCert?: string;
    tlsClientKey?: string;
  };
  ports: {
    rest: number;
    grpc: number;
    p2p: number;
  };
}

export interface EclairNode extends LightningNode {
  ports: {
    rest: number;
    p2p: number;
  };
}

export interface BitcoinNode extends CommonNode {
  type: 'bitcoin';
  implementation: 'bitcoind' | 'btcd';
  peers: string[];
  ports: {
    rpc: number;
    p2p: number;
    zmqBlock: number;
    zmqTx: number;
  };
}

export interface TapNode extends CommonNode {
  type: 'tap';
  implementation: 'tapd';
  ports: Record<string, number | undefined>;
}

export interface TapdNode extends TapNode {
  lndName: string;
  paths: {
    tlsCert: string;
    adminMacaroon: string;
  };
  ports: {
    rest: number;
    grpc: number;
  };
}

export type NodeImplementation =
  | BitcoinNode['implementation']
  | LightningNode['implementation']
  | TapNode['implementation'];

export type AnyNode = BitcoinNode | LightningNode | TapNode;

export interface OpenChannelOptions {
  from: LightningNode;
  toRpcUrl: string;
  amount: string;
  isPrivate: boolean;
}

export interface NodeBasePorts {
  LND: {
    rest: number | null;
    grpc: number | null;
  };
  'c-lightning': {
    rest: number | null;
    grpc: number | null;
  };
  eclair: {
    rest: number | null;
  };
  bitcoind: {
    rest: number | null;
  };
  tapd: {
    rest: number | null;
    grpc: number | null;
  };
}
