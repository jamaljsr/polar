import { Selector } from 'testcafe';

class NetworkView {
  lndNodes = Selector('[data-tid=ln-nodes] .ant-card');
  bitcoindNodes = Selector('[data-tid=btc-nodes] .ant-card');

  getLndNodeCount = () => this.lndNodes.count;
  getBitcoindNodeCount = () => this.bitcoindNodes.count;
}

export default new NetworkView();
