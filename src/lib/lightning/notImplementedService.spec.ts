import { getNetwork } from 'utils/tests';
import service from './notImplementedService';

describe('NotImplementedService', () => {
  const node = getNetwork().nodes.lightning[0];
  const msg = (name: string) => `${name} is not implemented for LND nodes`;

  it('should throw for all methods', () => {
    expect(() => service.waitUntilOnline(node)).toThrow(msg('waitUntilOnline'));
    expect(() => service.getInfo(node)).toThrow(msg('getInfo'));
    expect(() => service.getBalances(node)).toThrow(msg('getBalances'));
    expect(() => service.getNewAddress(node)).toThrow(msg('getNewAddress'));
    expect(() => service.getChannels(node)).toThrow(msg('getChannels'));
    expect(() => service.getPeers(node)).toThrow(msg('getPeers'));
    expect(() => service.connectPeers(node, [])).toThrow(msg('connectPeers'));
    expect(() =>
      service.openChannel({ from: node, toRpcUrl: '', amount: '', isPrivate: false }),
    ).toThrow(msg('openChannel'));
    expect(() => service.closeChannel(node, '')).toThrow(msg('closeChannel'));
    expect(() => service.createInvoice(node, 0, '')).toThrow(msg('createInvoice'));
    expect(() => service.payInvoice(node, '')).toThrow(msg('payInvoice'));
    expect(() => service.decodeInvoice(node, '')).toThrow(msg('decodeInvoice'));
    expect(() => service.addListenerToNode(node)).toThrow(msg('addListenerToNode'));
    expect(() => service.removeListener(node)).toThrow(msg('removeListener'));
    expect(() => service.subscribeChannelEvents(node, () => Promise<void>)).toThrow(
      msg('subscribeChannelEvents'),
    );
  });
});
