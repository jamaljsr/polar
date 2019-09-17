import { Selector } from 'testcafe';

class NewNetwork {
  nameInput = Selector('input[id=name]');
  lndNodesInput = Selector('input[id=lndNodes]');
  submitBtn = Selector('button[type=submit]').withExactText('Create');
  notification = Selector('.ant-notification-notice-message');

  getNotificationText = () => this.notification.innerText;
}

export default new NewNetwork();
