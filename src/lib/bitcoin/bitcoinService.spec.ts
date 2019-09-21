import bitcoindService from './bitcoindService';

describe('bitcoindService', () => {
  it('should get blockchain info', async () => {
    console.warn('getinfo', await bitcoindService.getBlockchainInfo());
  });

  it('should be able to mine more blocks', async () => {
    console.warn('mine', await bitcoindService.mine(3));
  });
});
