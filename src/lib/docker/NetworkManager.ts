import ComposeFile from './ComposeFile';

class NetworkManager {
  start(network: Network) {
    this._buildComposeFile(network);
  }

  private _buildComposeFile(network: Network) {
    const file = new ComposeFile();
    network.nodes.bitcoin.forEach(node => {
      file.addBitcoind(node.name);
    });
    network.nodes.lightning.forEach(node => {
      file.addLnd(node.name);
    });
    console.log(JSON.stringify(file.content, null, 2));
  }
}

export default new NetworkManager();
