export enum Status {
  Starting,
  Started,
  Stopping,
  Stopped,
  Error,
}

export interface CommonNode {
  // TODO: change id to a uuid
  id: number;
  networkId: number;
  name: string;
  type: 'bitcoin' | 'lightning';
  version: string;
  status: Status;
  errorMsg?: string;
}

export interface LightningNode extends CommonNode {
  type: 'lightning';
  implementation: 'LND' | 'c-lightning' | 'eclair';
  backendName: string;
  ports: Record<string, number | undefined>;
}

export enum LndVersion {
  latest = '0.8.2-beta',
  '0.8.0-beta' = '0.8.0-beta',
  '0.7.1-beta' = '0.7.1-beta',
}

export enum CLightningVersion {
  latest = '0.7.3',
}

export enum BitcoindVersion {
  latest = '0.19.0.1',
  '0.18.1' = '0.18.1',
}

export interface LndNode extends LightningNode {
  paths: {
    tlsCert: string;
    adminMacaroon: string;
    readonlyMacaroon: string;
  };
  ports: {
    rest: number;
    grpc: number;
  };
}

export interface CLightningNode extends LightningNode {
  paths: {
    macaroon: string;
  };
  ports: {
    rest: number;
  };
}

export interface BitcoinNode extends CommonNode {
  type: 'bitcoin';
  implementation: 'bitcoind' | 'btcd';
  peers: string[];
  ports: {
    rpc: number;
  };
}

export type NodeImplementation =
  | BitcoinNode['implementation']
  | LightningNode['implementation'];

export interface DockerConfig {
  volumeDirName: string;
}
