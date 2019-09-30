import { Selector } from 'testcafe';

class NewNetwork {
  nameInput = Selector('input[id=name]');
  lndNodesInput = Selector('input[id=lndNodes]');
  submitBtn = Selector('button[type=submit]').withExactText('Create');
}

export default new NewNetwork();
