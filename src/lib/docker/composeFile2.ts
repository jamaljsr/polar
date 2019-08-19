/* eslint-disable @typescript-eslint/camelcase */
import { bitcoind, lnd } from './nodeTemplates';

export interface ComposeService {
  image: string;
  container_name: string;
  user: string;
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

  addBitcoind(name: string) {
    this.content.services[name] = bitcoind(name);
  }

  addLnd(name: string, backendName: string) {
    this.content.services[name] = lnd(name, backendName);
  }
}

export default ComposeFile;
