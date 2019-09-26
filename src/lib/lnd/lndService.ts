import { join } from 'path';
import { createIpcSender, IcpSender } from 'lib/ipc/ipcService';
import { LndLibrary, LNDNode } from 'types';

class LndService implements LndLibrary {
  ipc: IcpSender;

  constructor() {
    this.ipc = createIpcSender('LndService', 'lnd');
  }

  async connect(node: LNDNode): Promise<void> {
    const macAppPath = join('/', 'Users', 'jamal', 'Library', 'Application Support');
    const dataPath = join(process.env['APPDATA'] || macAppPath, 'polar', 'data');
    const adminMacaroonPath = join(
      'data',
      'chain',
      'bitcoin',
      'regtest',
      'admin.macaroon',
    );
    const nodePath = join(dataPath, 'networks', '1', 'volumes', 'lnd', node.name);
    const config = {
      server: `127.0.0.1:${node.ports.grpc}`,
      tls: join(nodePath, 'tls.cert'),
      macaroonPath: join(nodePath, adminMacaroonPath),
    };
    await this.ipc('connect', { node, config });
  }

  async getInfo(node: LNDNode): Promise<void> {
    await this.ipc('get-info', { name: node.name });
  }
}

export default new LndService();
