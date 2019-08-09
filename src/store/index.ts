import { routerMiddleware } from 'connected-react-router';
import { createStore, createTypedHooks } from 'easy-peasy';
import { createHashHistory } from 'history';
import { createLogger } from 'redux-logger';
import { createModel, RootModel } from './models';

export const history = createHashHistory();

export const createReduxStore = () => {
  // Redux store Configuration
  const middleware = [];

  // Skip redux logs in console during the tests
  if (process.env.NODE_ENV !== 'test') {
    // Logging Middleware
    const logger = createLogger({
      level: 'info',
      collapsed: true,
    });

    middleware.push(logger);
  }

  // Router Middleware
  const router = routerMiddleware(history);
  middleware.push(router);

  const models = createModel(history);

  // create easy-peasy store
  return createStore(models, {
    middleware,
  });
};

const store = createReduxStore();

// export hooks directly from the store to get proper type inference
const typedHooks = createTypedHooks<RootModel>();
export const { useStoreActions, useStoreDispatch, useStoreState } = typedHooks;

// enable hot reload for models
if (process.env.NODE_ENV === 'development') {
  if ((module as any).hot) {
    (module as any).hot.accept('./models', () => {
      const models = createModel(history);
      store.reconfigure(models);
    });
  }
}

export default store;
