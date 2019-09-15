import { Selector } from 'testcafe';

class NetworkView {
  lndNodes = Selector('[class^=node__]').withText('lnd');
  bitcoindNodes = Selector('[class^=node__]').withText('bitcoind');

  getLndNodeCount = () => this.lndNodes.count;
  getBitcoindNodeCount = () => this.bitcoindNodes.count;
}

export default new NetworkView();
