import ComposeFile from './ComposeFile';
import yaml from 'js-yaml';
import { join } from 'path';
import { writeDataFile } from 'utils/files';
import { info } from 'electron-log';

class NetworkManager {
  public async create(network: Network) {
    info(`adding network '${network.name}' to the NetworkManager`);
    await this.createComposeFile(network);
  }

  private async createComposeFile(network: Network) {
    const file = new ComposeFile();
    network.nodes.bitcoin.forEach(node => {
      file.addBitcoind(node.name);
    });
    network.nodes.lightning.forEach(node => {
      file.addLnd(node.name, node.backendName);
    });

    const yml = yaml.dump(file.content);
    const path = join('networks', network.id.toString(), 'docker-compose.yml');
    await writeDataFile(path, yml);
    info(`created compose file for '${network.name}' at '${path}'`);
  }
}

export default new NetworkManager();
