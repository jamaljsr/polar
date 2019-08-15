/* eslint-disable @typescript-eslint/camelcase */
import { bitcoind, lnd } from './nodeTemplates';

export interface ComposeService {
  [key: string]: {
    image: string;
    container_name: string;
    user: string;
    command: string;
    volumes: string[];
    expose: string[];
    ports: string[];
    restart?: 'always';
  };
}

export interface ComposeContent {
  version: string;
  services: ComposeService[];
}

class ComposeFile {
  content: ComposeContent;

  constructor() {
    this.content = {
      version: '3.3',
      services: [],
    };
  }

  addBitcoind(name: string) {
    this.content.services.push(bitcoind(name));
  }

  addLnd(name: string) {
    this.content.services.push(lnd(name));
  }
}

export default ComposeFile;
