import { Selector } from 'testcafe';

class Home {
  getStarted = Selector('.ant-card-head-title');
  createButton = Selector('button').withExactText('Create your first Network');
  cardTitles = Selector('.ant-card-head-title');

  getStartedText = () => this.getStarted.innerText;
  clickCreateButton = async (t: TestController) => t.click(this.createButton);
  getCardTitleWithText = (text: string) => this.cardTitles.withExactText(text);
}

export default new Home();
