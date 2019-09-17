import { Selector } from 'testcafe';

class App {
  newNetworkIcon = Selector('[data-tid=create-icon]');
  firstNetworkMenu = Selector('[data-tid=network-1]');

  getFirstNetworkText = () => this.firstNetworkMenu.innerText;
  clickNewNetworkIcon = async (t: TestController) => t.click(this.newNetworkIcon);
}

export default new App();
