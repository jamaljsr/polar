import { Selector } from 'testcafe';

class Home {
  successAlert: Selector = Selector('[data-tid=success]');
  counterLink: Selector = Selector('[data-tid=counter-link]');
  clickMeButton: Selector = Selector('[data-tid=me-btn]');

  clickCounterLink = async (t: TestController) => t.click(this.counterLink);
}

export default new Home();
