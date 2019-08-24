import { Selector } from 'testcafe';

class Home {
  successAlert: Selector = Selector('[data-tid=success]');
  networkLink: Selector = Selector('[data-tid=network-link]');
  clickMeButton: Selector = Selector('[data-tid=me-btn]');

  clickNetworkLink = async (t: TestController) => t.click(this.networkLink);
}

export default new Home();
