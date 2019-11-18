import { BitcoinNode, CommonNode, LightningdNode, LndNode } from 'shared/types';
import { getContainerName } from 'utils/network';
/* eslint-disable @typescript-eslint/camelcase */
import { bitcoind, lightningd, lnd } from './nodeTemplates';

export interface ComposeService {
  image: string;
  container_name: string;
  environment: Record<string, string>;
  hostname: string;
  command: string;
  volumes: string[];
  expose: string[];
  ports: string[];
  restart?: 'always';
}

export interface ComposeContent {
  version: string;
  services: {
    [key: string]: ComposeService;
  };
}

class ComposeFile {
  content: ComposeContent;

  constructor() {
    this.content = {
      version: '3.3',
      services: {},
    };
  }

  addBitcoind(node: BitcoinNode) {
    const { name, version, ports } = node;
    const container = getContainerName(node);
    this.content.services[name] = bitcoind(name, container, version, ports.rpc);
  }

  addLnd(node: LndNode, backend: CommonNode) {
    const {
      name,
      version,
      ports: { rest, grpc },
    } = node;
    const container = getContainerName(node);
    const backendName = getContainerName(backend);
    this.content.services[name] = lnd(name, container, version, backendName, rest, grpc);
  }

  addClightning(node: LightningdNode, backend: CommonNode) {
    const {
      name,
      version,
      ports: { rest },
    } = node;
    const container = getContainerName(node);
    const backendName = getContainerName(backend);
    this.content.services[name] = lightningd(name, container, version, backendName, rest);
  }
}

export default ComposeFile;
