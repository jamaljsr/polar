import { createStore } from 'easy-peasy';
import { injections } from 'utils/tests';
import appModel from './app';

describe('App model', () => {
  // initialize store for type inference
  let store = createStore(appModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(appModel, { injections });
  });

  it('should have a valid initial state', () => {
    expect(store.getState().sidebarCollapsed).toEqual(false);
  });

  it('should toggle sidebarCollapsed value', () => {
    expect(store.getState().sidebarCollapsed).toEqual(false);
    store.getActions().collapseSidebar(true);
    expect(store.getState().sidebarCollapsed).toEqual(true);
    store.getActions().collapseSidebar(false);
    expect(store.getState().sidebarCollapsed).toEqual(false);
  });
});
