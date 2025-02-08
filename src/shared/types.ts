export enum Status {
  Starting,
  Started,
  Stopping,
  Stopped,
  Error,
}

export type NodeType = 'bitcoin' | 'lightning' | 'tap' | 'ark';

export type NodeTypeToImplementation<T extends NodeType> = T extends 'bitcoin'
  ? BitcoinNode
  : T extends 'lightning'
  ? LightningNode
  : T extends 'tap'
  ? TapNode
  : T extends 'ark'
  ? ArkNode
  : never;

export type NodeImplementationToType<T extends NodeImplementation> = T extends 'bitcoind'
  ? BitcoindNode
  : T extends 'arkd'
  ? ArkNode
  : T extends 'LND'
  ? LndNode
  : T extends 'eclair'
  ? EclairNode
  : T extends 'c-lightning'
  ? CLightningNode
  : T extends 'litd'
  ? LitdNode
  : T extends 'tapd'
  ? TapdNode
  : never;

export interface CommonNode {
  id: number;
  networkId: number;
  name: string;
  type: NodeType;
  version: string;
  status: Status;
  errorMsg?: string;
  docker: {
    image: string;
    command: string;
  };
}

export type LightningImplementations = 'LND' | 'c-lightning' | 'eclair' | 'litd';

export interface LightningNode extends CommonNode {
  type: 'lightning';
  implementation: LightningImplementations;
  backendName: string;
  ports: Record<string, number | undefined>;
}

export interface LndNode extends LightningNode {
  implementation: 'LND';
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
  implementation: 'c-lightning';
  paths: {
    rune: string;
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
  implementation: 'eclair';
  ports: {
    rest: number;
    p2p: number;
  };
}

export type BitcoinImplementations = 'bitcoind' | 'btcd';

export interface BitcoinNode extends CommonNode {
  type: 'bitcoin';
  implementation: BitcoinImplementations;
  peers: string[];
  ports: Record<string, number>;
}

export interface BitcoindNode extends BitcoinNode {
  implementation: 'bitcoind';
  ports: {
    rpc: number;
    rest: number;
    p2p: number;
    zmqBlock: number;
    zmqTx: number;
  };
}

export type TapImplementations = 'tapd' | 'litd';

export interface TapNode extends CommonNode {
  type: 'tap';
  implementation: TapImplementations;
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

export type ArkImplementations = 'arkd';

export interface ArkNode extends CommonNode {
  type: 'ark';
  backendName: string;
  implementation: ArkImplementations;
  ports: {
    api: number;
  };
  paths: {
    macaroon: string;
    tlsCert: string;
  };
}

export interface ArkdNode extends ArkNode {
  implementation: 'arkd';
}

export interface LitdNode extends LightningNode {
  implementation: 'litd';
  // lndName is the name of the lnd node that the lit node is connected to. For litd,
  // this will always be the same as the litd node name, since it runs tapd integrated.
  // We keep it also under this field for consistency with TapdNode. It greatly simplifies
  // the code used to get the lnd node name that the lit node is connected to.
  lndName: string;
  paths: {
    // lnd paths
    tlsCert: string;
    adminMacaroon: string;
    invoiceMacaroon: string;
    readonlyMacaroon: string;
    // lit paths
    litTlsCert: string;
    litMacaroon: string;
    // tap paths
    tapMacaroon: string;
  };
  ports: {
    rest: number;
    grpc: number;
    p2p: number;
    web: number;
  };
}

export type NodeImplementation =
  | LightningImplementations
  | BitcoinImplementations
  | ArkImplementations
  | TapImplementations;

export type AnyNode = BitcoinNode | LightningNode | TapNode | ArkNode;

export type AnyImplementation =
  | BitcoindNode
  | LndNode
  | EclairNode
  | CLightningNode
  | LitdNode
  | TapdNode
  | ArkdNode;

export type TapSupportedNode = TapdNode | LitdNode;

export interface OpenChannelOptions {
  from: LightningNode;
  toRpcUrl: string;
  amount: string;
  isPrivate: boolean;
}
