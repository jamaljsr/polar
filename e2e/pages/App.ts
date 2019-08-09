import { Selector } from 'testcafe';

class App {
  navHomeLink: Selector = Selector('[data-tid=nav-home]');
  navCounterLink: Selector = Selector('[data-tid=nav-counter]');

  clickHomeLink = async (t: TestController) => t.click(this.navHomeLink);
  clickCounterLink = async (t: TestController) => t.click(this.navCounterLink);
}

export default new App();
