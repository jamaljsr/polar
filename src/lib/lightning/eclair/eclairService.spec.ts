import { WalletInfo } from 'bitcoin-core';
import bitcoindService from 'lib/bitcoin/bitcoindService';
import { defaultStateBalances, defaultStateInfo, getNetwork } from 'utils/tests';
import { eclairService } from './';
import * as eclairApi from './eclairApi';
import * as ELN from './types';

jest.mock('./eclairApi');
jest.mock('lib/bitcoin/bitcoindService');

const eclairApiMock = eclairApi as jest.Mocked<typeof eclairApi>;
const bitcoindServiceMock = bitcoindService as jest.Mocked<typeof bitcoindService>;

describe('EclairService', () => {
  const network = getNetwork();
  const node = network.nodes.lightning[2];
  const backend = network.nodes.bitcoin[0];

  it('should get node info', async () => {
    const infoResponse: Partial<ELN.GetInfoResponse> = {
      nodeId: 'asdf',
      alias: '',
      publicAddresses: ['1.1.1.1:9735'],
      blockHeight: 0,
    };
    eclairApiMock.httpPost.mockResolvedValue(infoResponse);
    const expected = defaultStateInfo({
      pubkey: 'asdf',
      rpcUrl: 'asdf@1.1.1.1:9735',
      syncedToChain: true,
    });
    const actual = await eclairService.getInfo(node);
    expect(actual).toEqual(expected);
  });

  it('should get wallet balance', async () => {
    const ballanceResponse: Partial<WalletInfo> = {
      balance: 0.00001,
      // eslint-disable-next-line @typescript-eslint/camelcase
      unconfirmed_balance: 0,
      // eslint-disable-next-line @typescript-eslint/camelcase
      immature_balance: 0,
    };
    bitcoindServiceMock.getWalletInfo.mockResolvedValue(ballanceResponse as any);

    const expected = defaultStateBalances({ confirmed: '1000', total: '1000' });
    const actual = await eclairService.getBalances(node, backend);
    expect(actual).toEqual(expected);
  });

  it('should get new address', async () => {
    const expected = { address: 'abcdef' };
    eclairApiMock.httpPost.mockResolvedValue(expected.address);
    const actual = await eclairService.getNewAddress(node);
    expect(actual).toEqual(expected);
  });

  it('should get a list of channels', async () => {
    const chanResponse: ELN.ChannelResponse = {
      nodeId: 'abcdef',
      channelId: '65sdfd7',
      state: ELN.ChannelState.NORMAL,
      data: {
        commitments: {
          localParams: {
            isFunder: true,
          },
          localCommit: {
            spec: {
              toLocal: 100000000,
              toRemote: 50000000,
            },
          },
          commitInput: {
            amountSatoshis: 150000,
          },
        },
      },
    };
    eclairApiMock.httpPost.mockResolvedValue([chanResponse]);
    const expected = [expect.objectContaining({ pubkey: 'abcdef' })];
    const actual = await eclairService.getChannels(node);
    expect(actual).toEqual(expected);
  });
});
