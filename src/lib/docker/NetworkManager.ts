import ComposeFile from './ComposeFile';
import yaml from 'js-yaml';
import fs from 'fs';

class NetworkManager {
  start(network: Network) {
    this.buildComposeFile(network);
  }

  private buildComposeFile(network: Network) {
    const file = new ComposeFile();
    network.nodes.bitcoin.forEach(node => {
      file.addBitcoind(node.name);
    });
    network.nodes.lightning.forEach(node => {
      file.addLnd(node.name, node.backendName);
    });

    console.log(file.content);
    const yml = yaml.dump(file.content);
    fs.writeFileSync('./dc.yml', yml);
  }
}

export default new NetworkManager();
