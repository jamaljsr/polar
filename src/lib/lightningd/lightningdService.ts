import { LightningdNode } from 'shared/types';
import { read } from 'utils/files';

class LightningdService {
  async getInfo(node: LightningdNode) {
    return await this.request(node, 'getinfo');
  }

  private async request(node: LightningdNode, path: string) {
    const { paths, ports } = node;
    const url = `http://127.0.0.1:${ports.rest}/v1/${path}`;
    const macaroon = await read(paths.macaroon, 'base64');
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        macaroon,
      },
    });
    return await response.json();
  }
}

export default new LightningdService();
