export interface LocalConfig {
  fallbackLng: string;
  languages: {
    [key: string]: string;
  };
}

export enum Status {
  Starting,
  Started,
  Stopping,
  Stopped,
}

export interface NetworkNode {
  id: number;
  name: string;
  type: 'bitcoin' | 'lightning';
  status: Status;
}

export interface BitcoinNode extends NetworkNode {
  type: 'bitcoin';
}

export interface LightningNode extends NetworkNode {
  type: 'lightning';
  backendName: string;
}

export interface Network {
  id: number;
  name: string;
  status: Status;
  nodes: {
    bitcoin: BitcoinNode[];
    lightning: LightningNode[];
  };
}
