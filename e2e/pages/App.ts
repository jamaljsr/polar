import { Selector } from 'testcafe';

class App {
  hamburgerMenu = Selector('[data-icon=menu]');
  createNEtworkItem = Selector('.ant-dropdown-menu-item').withExactText('Create Network');

  clickNHamburgerMenu = async (t: TestController) => t.click(this.hamburgerMenu);
  clickNCreateNetwork = async (t: TestController) =>
    t.click(this.hamburgerMenu).click(this.createNEtworkItem);
}

export default new App();
