import { Selector } from 'testcafe';

class NetworkView {
  lndNodes = Selector('[data-tid^=lnd-]');
  bitcoindNodes = Selector('[data-tid^=bitcoind]');

  getLndNodeCount = () => this.lndNodes.count;
  getBitcoindNodeCount = () => this.bitcoindNodes.count;
}

export default new NetworkView();
