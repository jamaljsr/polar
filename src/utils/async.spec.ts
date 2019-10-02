import { delay, waitFor } from './async';

describe('Async Util', () => {
  describe('delay', () => {
    it('should continue after some time', async () => {
      const spy = jest.fn(() => true);
      const promise = delay(10).then(spy);
      expect(spy).not.toBeCalled();
      await expect(promise).resolves.toBeTruthy();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('waitFor', () => {
    it('should resolve immediately if condition is true', async () => {
      const condition = jest.fn().mockResolvedValue(true);
      const result = await waitFor(condition);
      expect(result).toBe(true);
      expect(condition).toBeCalledTimes(1);
    });

    it('should timeout if the condition is never true', async () => {
      const condition = jest.fn().mockResolvedValue(false);
      await expect(waitFor(condition, 10, 30)).resolves.toBe(false);
    });

    it('should resolve once the condition becomes true', async () => {
      // return false initially
      const condition = jest.fn().mockResolvedValue(false);
      // chain the spy onto the promise so we can inspect if its been called
      const spy = jest.fn(x => x);
      const promise = waitFor(condition, 10, 100).then(spy);
      // confirm it isn't called immediately
      expect(spy).not.toBeCalled();
      // make condition return true
      condition.mockResolvedValue(true);
      // wait for the promise to be resolved
      await expect(promise).resolves.toBe(true);
      // confirm the spy was called
      expect(spy).toBeCalled();
    });
  });
});
