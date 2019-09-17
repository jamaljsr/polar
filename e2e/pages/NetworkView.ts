import { Selector } from 'testcafe';

class NetworkView {
  backButton = Selector('.ant-page-header-back-button');
  lndNodes = Selector('[class^=node__]').withText('lnd');
  bitcoindNodes = Selector('[class^=node__]').withText('bitcoind');

  getLndNodeCount = () => this.lndNodes.count;
  getBitcoindNodeCount = () => this.bitcoindNodes.count;
}

export default new NetworkView();
