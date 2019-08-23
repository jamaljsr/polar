import { Selector } from 'testcafe';

class App {
  newNetworkBtn = Selector('[data-tid=create-btn]');
  firstNetworkMenu = Selector('[data-tid=network-0]');

  getFirstNetworkText = () => this.firstNetworkMenu.innerText;
  clickNewNetworkBtn = async (t: TestController) => t.click(this.newNetworkBtn);
}

export default new App();
