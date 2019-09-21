/* eslint-disable @typescript-eslint/camelcase */
import { bitcoind, lnd } from './nodeTemplates';

export interface ComposeService {
  image: string;
  container_name: string;
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

  addBitcoind(name: string, version: string, rpcPort: number) {
    this.content.services[name] = bitcoind(name, version, rpcPort);
  }

  addLnd(
    name: string,
    version: string,
    backendName: string,
    restPort: number,
    grpcPort: number,
  ) {
    this.content.services[name] = lnd(name, version, backendName, restPort, grpcPort);
  }
}

export default ComposeFile;
