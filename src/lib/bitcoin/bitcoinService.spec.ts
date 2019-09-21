import bitcoindService from './bitcoindService';

describe('bitcoindService', () => {
  it('should be able to mine more blocks', async () => {
    console.warn('mine', await bitcoindService.mine(1));
  });
});
