import { Selector } from 'testcafe';

class Home {
  successAlert = Selector('.ant-alert-message').withExactText('Success Tips');
  networkLink = Selector('a').withExactText('Network');
  clickMeButton = Selector('button').withExactText('Click Me!');

  clickNetworkLink = async (t: TestController) => t.click(this.networkLink);
}

export default new Home();
