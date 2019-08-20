import { Selector } from 'testcafe';

class App {
  navHomeLink: Selector = Selector('[data-tid=nav-home]');
  navCounterLink: Selector = Selector('[data-tid=nav-counter]');
  newNetworkBtn: Selector = Selector('[data-tid=new-network]');

  clickHomeLink = async (t: TestController) => t.click(this.navHomeLink);
  clickCounterLink = async (t: TestController) => t.click(this.navCounterLink);
  clickNewNetworkBtn = async (t: TestController) => t.click(this.newNetworkBtn);
}

export default new App();
