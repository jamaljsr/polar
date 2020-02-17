import { Selector } from 'testcafe';

class Home {
  getStarted = Selector('.ant-card-head-title');
  createButton = Selector('button').withExactText('Create a Lightning Network');
  importButton = Selector('button').withExactText('Import a Lightning Network');
  cardTitles = Selector('.ant-card-head-title');

  getStartedText = () => this.getStarted.innerText;
  clickCreateButton = async (t: TestController) => t.click(this.createButton);
  clickImportButton = async (t: TestController) => t.click(this.importButton);
  getCardTitleWithText = (text: string) => this.cardTitles.withExactText(text);
}

export default new Home();
