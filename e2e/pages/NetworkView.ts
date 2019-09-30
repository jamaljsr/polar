import { Selector } from 'testcafe';

class NetworkView {
  backButton = Selector('.ant-page-header-back-button');
  headingTitle = Selector('.ant-page-header-heading-title');
  lndNodes = Selector('[class*="x-Node "]').withText('lnd');
  bitcoindNodes = Selector('[class*="x-Node "]').withText('bitcoind');

  getHeadingTitleText = () => this.headingTitle.innerText;
  getLndNodeCount = () => this.lndNodes.count;
  getBitcoindNodeCount = () => this.bitcoindNodes.count;
}

export default new NetworkView();
