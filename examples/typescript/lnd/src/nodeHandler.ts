import { LnRpc, Peer, WalletUnlockerRpc } from '@radar/lnrpc';
import inquirer from 'inquirer';
import { cropStringMiddle } from './utils';

enum BaseAnswers {
  OpenChannel = 'Open a channel',
  ListPeers = 'List peers',
  ListPendingChannels = 'List pending channels',
  ListOpenChannels = 'List open channels',
}

export default class NodeHandler {
  constructor(private lnrpc: LnRpc & WalletUnlockerRpc) {}

  whatWouldYouLikeToDo = async () => {
    try {
      const info = await this.lnrpc.getInfo();
      const { action } = await inquirer.prompt<{ action: BaseAnswers }>({
        type: 'list',
        name: 'action',
        message: `Hi ${info.alias}, what would you like to do?`,
        choices: Object.values(BaseAnswers),
      });
      let answerOrNextQuestion = await this.getAnswer(action);
      while (typeof answerOrNextQuestion !== 'string') {
        answerOrNextQuestion = await answerOrNextQuestion();
      }
      console.log(answerOrNextQuestion);
      await this.whatWouldYouLikeToDo();
    } catch (err) {
      console.error('Sorry, something went wrong trying to connect with your LND node');
    }
  };

  getAnswer = async (
    question: BaseAnswers,
  ): Promise<string | (() => Promise<string>)> => {
    switch (question) {
      case 'Open a channel': {
        return this.specifyChannelOpeningParameters;
      }
      case 'List peers': {
        const { peersWithAliases } = await this.getPeersWithAliases();
        return `Your peers:\n\n`.concat(
          peersWithAliases.map(p => p.alias || cropStringMiddle(p.pubKey, 4)).join('\n'),
        );
      }
      case 'List pending channels': {
        const info = await this.lnrpc.pendingChannels();
        return `Pending channels:\n${JSON.stringify(info)}`;
      }
      case 'List open channels': {
        const info = await this.lnrpc.listChannels();
        return `Open channels:\n${JSON.stringify(info)}`;
      }
      default:
        throw new Error('Question not recognized');
    }
  };

  specifyChannelOpeningParameters = async () => {
    const { peersWithPubKeys } = await this.getPeersWithPubKeys();
    const { pubKey } = await inquirer.prompt<{ pubKey: string }>({
      type: 'list',
      name: 'pubKey',
      message: 'Which peer would you like to open a channel with?',
      choices: peersWithPubKeys,
    });
    const { amount } = await inquirer.prompt<{ amount: number }>({
      type: 'number',
      name: 'amount',
      message: 'How much (in Satoshis) would you like to open with (e.g. 100000)?',
      validate: answer => {
        if (!answer || answer < 100000) {
          return 'You must choose an amount greater than 100,000 satoshis.';
        }
        return true;
      },
    });
    await this.lnrpc.openChannelSync({
      nodePubkeyString: pubKey,
      localFundingAmount: amount.toString(),
    });
    return 'Success!';
  };

  getPeersWithPubKeys = async () => {
    const { peers } = await this.lnrpc.listPeers();
    const peersWithPubKeys = peers.map(peer => peer.pubKey);
    return { peersWithPubKeys };
  };

  getPeersWithAliases = async () => {
    const { peers } = await this.lnrpc.listPeers();

    const { nodes } = await this.lnrpc.describeGraph();
    const peersWithAliases = peers.map(peer => {
      const peerWithAlias: Peer & { alias?: string } = { ...peer };
      const maybeNode = nodes.find(e => e.pubKey === peerWithAlias.pubKey);
      if (maybeNode?.alias) {
        peerWithAlias.alias = maybeNode.alias;
      }
      return peerWithAlias;
    });
    return { peersWithAliases };
  };
}
