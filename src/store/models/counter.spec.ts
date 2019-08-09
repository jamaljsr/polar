import counterModel from './counter';
import { createStore } from 'easy-peasy';

describe('counter model', () => {
  // initialize store for type inference
  let store = createStore(counterModel);

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(counterModel);
  });

  it('should have a valid initial state', () => {
    expect(store.getState().count).toBe(0);
  });

  it('should increment by one', () => {
    store.getActions().increment();
    expect(store.getState().count).toBe(1);
  });

  it('should decrement by one', () => {
    store.getActions().decrement();
    expect(store.getState().count).toBe(-1);
  });

  it('should increment by two if count is odd', () => {
    // initialize state with an odd number
    store = createStore(counterModel, { initialState: { count: 1 } });
    store.getActions().incrementIfOdd();
    expect(store.getState().count).toBe(3);
  });

  it('should not increment by two if count is even', () => {
    store.getActions().incrementIfOdd();
    expect(store.getState().count).toBe(0);
  });

  it('should increment after a delay', async () => {
    await store.getActions().incrementAsync();
    expect(store.getState().count).toBe(1);
  });

  it('should fail to increment after a delay if count is three', async () => {
    expect.assertions(1);
    try {
      // initialize state with count set to three
      store = createStore(counterModel, { initialState: { count: 3 } });
      await store.getActions().incrementAsync();
    } catch (e) {
      expect(e.message).toMatch('models.counter.increment-async.error');
    }
  });
});
