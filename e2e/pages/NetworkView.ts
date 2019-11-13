import { Selector } from 'testcafe';

class NetworkView {
  backButton = Selector('.ant-page-header-back-button');
  headingTitle = Selector('.ant-page-header-heading-title');
  aliceNode = Selector('[class*="x-Node "]').withText('alice');
  bobNode = Selector('[class*="x-Node "]').withText('bob');
  carolNode = Selector('[class*="x-Node "]').withText('carol');
  backendNode = Selector('[class*="x-Node "]').withText('backend');

  getHeadingTitleText = () => this.headingTitle.innerText;
}

export default new NetworkView();
