export enum Status {
  Starting,
  Started,
  Stopping,
  Stopped,
  Error,
}

export interface CommonNode {
  id: number;
  name: string;
  type: 'bitcoin' | 'lightning';
  version: string;
  status: Status;
}

export interface LightningNode extends CommonNode {
  type: 'lightning';
  implementation: 'LND' | 'c-lightning' | 'eclair';
  backendName: string;
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
