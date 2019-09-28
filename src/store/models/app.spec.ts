import { createStore } from 'easy-peasy';
import { injections } from 'utils/tests';
import appModel from './app';

describe('App model', () => {
  // initialize store for type inference
  let store = createStore(appModel, { injections, mockActions: true });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(appModel, { injections, mockActions: true });
  });

  it('should dispatch a push action in navigateTo', () => {
    store.getActions().navigateTo('/test');
    expect(store.getMockedActions()).toContainEqual({
      payload: {
        args: ['/test'],
        method: 'push',
      },
      type: '@@router/CALL_HISTORY_METHOD',
    });
  });
});
