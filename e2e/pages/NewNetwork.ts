import { Selector } from 'testcafe';

class NewNetwork {
  nameInput = Selector('[data-tid=name]');
  submitBtn = Selector('[data-tid=submit]');
  notification = Selector('.ant-notification-notice-message');

  getNotificationText = () => this.notification.innerText;
}

export default new NewNetwork();
