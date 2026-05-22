import { defaultRepoState } from 'utils/constants';
import { createNetwork } from 'utils/network';
import { defaultStateBalances, defaultStateInfo, testManagedImages } from 'utils/tests';
import ldkProxyClient from './ldkProxyClient';
import ldkServerService from './ldkServerService';

jest.mock('electron-log');
jest.mock('./ldkProxyClient');

describe('LdkServerService', () => {
  const network = createNetwork({
    id: 1,
    name: 'ldk-test',
    description: 'test',
    lndNodes: 0,
    clightningNodes: 0,
    eclairNodes: 0,
    ldkServerNodes: 1,
    litdNodes: 0,
    bitcoindNodes: 1,
    tapdNodes: 0,
    repoState: defaultRepoState,
    managedImages: testManagedImages,
    customImages: [],
    manualMineCount: 6,
  });
  const node = network.nodes.lightning[0];

  it('should get node info with channel counts', async () => {
    ldkProxyClient.getInfo = jest.fn().mockResolvedValue({
      node_id: '02abc',
      node_alias: 'alice',
      node_uris: ['02abc@127.0.0.1:9735'],
      current_best_block: { height: 120 },
    });
    ldkProxyClient.listChannels = jest.fn().mockResolvedValue({
      channels: [
        { is_channel_ready: true, is_usable: true },
        { is_channel_ready: false, is_usable: false },
        { is_channel_ready: true, is_usable: false },
      ],
    });

    const actual = await ldkServerService.getInfo(node);
    expect(actual).toEqual(
      defaultStateInfo({
        pubkey: '02abc',
        alias: 'alice',
        rpcUrl: '02abc@127.0.0.1:9735',
        syncedToChain: true,
        blockHeight: 120,
        numActiveChannels: 1,
        numPendingChannels: 1,
        numInactiveChannels: 1,
      }),
    );
  });

  it('should get balances', async () => {
    ldkProxyClient.getBalances = jest.fn().mockResolvedValue({
      total_onchain_balance_sats: '1000',
      spendable_onchain_balance_sats: '800',
      total_lightning_balance_sats: '500',
    });
    const actual = await ldkServerService.getBalances(node);
    expect(actual).toEqual(
      defaultStateBalances({ total: '1500', confirmed: '800', unconfirmed: '700' }),
    );
  });

  it('should get a new onchain address', async () => {
    ldkProxyClient.onchainReceive = jest
      .fn()
      .mockResolvedValue({ address: 'bcrt1qtest' });
    const actual = await ldkServerService.getNewAddress(node);
    expect(actual).toEqual({ address: 'bcrt1qtest' });
  });

  it('should reject non-ldk-server nodes', async () => {
    const lndNetwork = createNetwork({
      id: 2,
      name: 'lnd-test',
      description: 'test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      ldkServerNodes: 0,
      litdNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      repoState: defaultRepoState,
      managedImages: testManagedImages,
      customImages: [],
      manualMineCount: 6,
    });
    const lndNode = lndNetwork.nodes.lightning[0];
    await expect(ldkServerService.getInfo(lndNode)).rejects.toThrow(
      "LdkServerService cannot be used for 'LND' nodes",
    );
  });

  it('should wait until the node is synced', async () => {
    ldkProxyClient.getInfo = jest
      .fn()
      .mockResolvedValueOnce({ current_best_block: undefined })
      .mockResolvedValue({ current_best_block: { height: 10 } });
    await ldkServerService.waitUntilOnline(node);
    expect(ldkProxyClient.getInfo).toHaveBeenCalledTimes(2);
  });

  it('should wait for successful payment and return preimage', async () => {
    ldkProxyClient.decodeInvoice = jest.fn().mockResolvedValue({
      amount_msat: '1000',
      destination: '02dest',
    });
    ldkProxyClient.bolt11Send = jest.fn().mockResolvedValue({ payment_id: 'pid-1' });
    ldkProxyClient.getPaymentDetails = jest
      .fn()
      .mockResolvedValueOnce({ payment: { status: 'PENDING' } })
      .mockResolvedValueOnce({
        payment: {
          status: 'SUCCEEDED',
          kind: { bolt11: { preimage: 'preimage-1' } },
        },
      });

    const receipt = await ldkServerService.payInvoice(node, 'lnbcrt1test');
    expect(receipt.preimage).toBe('preimage-1');
    expect(ldkProxyClient.getPaymentDetails).toHaveBeenCalledTimes(2);
  });
});
