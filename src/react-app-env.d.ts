/// <reference types="react-scripts" />

declare module '*.module.less';

interface LocalConfig {
  fallbackLng: string;
  languages: {
    [key: string]: string;
  };
}

interface FogNode {
  id: number;
  name: string;
  type: 'bitcoin' | 'lightning';
}

interface BitcoinNode extends FogNode {
  type: 'bitcoin';
}

interface LightningNode extends FogNode {
  type: 'lightning';
  backendName: string;
}

interface Network {
  id: number;
  name: string;
  nodes: {
    bitcoin: BitcoinNode[];
    lightning: LightningNode[];
  };
}
