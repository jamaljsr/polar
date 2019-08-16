import ComposeFile from './ComposeFile';
import yaml from 'js-yaml';
import { join } from 'path';
import { writeDataFile } from 'utils/files';
import dockerService from './DockerService';

class NetworkManager {
  async start(network: Network) {
    await this.buildComposeFile(network);
    dockerService.start(network);
  }

  private async buildComposeFile(network: Network) {
    const file = new ComposeFile();
    network.nodes.bitcoin.forEach(node => {
      file.addBitcoind(node.name);
    });
    network.nodes.lightning.forEach(node => {
      file.addLnd(node.name, node.backendName);
    });

    const yml = yaml.dump(file.content);
    const path = join(network.id.toString(), 'docker-compose.yml');
    await writeDataFile(path, yml);
  }
}

export default new NetworkManager();
