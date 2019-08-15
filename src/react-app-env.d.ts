/// <reference types="react-scripts" />

declare module '*.module.less';

interface LocalConfig {
  fallbackLng: string;
  languages: {
    [key: string]: string;
  };
}

interface BitcoinNode {
  id: number;
  name: string;
}

interface LightningNode {
  id: number;
  name: string;
  bitcoinNodeId: number;
}

interface Network {
  id: number;
  name: string;
  nodes: {
    bitcoin: BitcoinNode[];
    lightning: LightningNode[];
  };
}
