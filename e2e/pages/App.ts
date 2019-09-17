import { Selector } from 'testcafe';

class App {
  logoLink = Selector('[class^=logo__] a');
  hamburgerMenu = Selector('[data-icon=menu]');
  createNetworkItem = Selector('.ant-dropdown-menu-item').withExactText('Create Network');

  clickHamburgerMenu = async (t: TestController) => t.click(this.hamburgerMenu);
  clickCreateNetwork = async (t: TestController) =>
    t
      .click(this.hamburgerMenu)
      .expect(this.createNetworkItem)
      .ok()
      .click(this.createNetworkItem);
}

export default new App();
