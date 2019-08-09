import { Action, action, Thunk, thunk } from 'easy-peasy';
import i18n from 'i18next';
import { info } from 'electron-log';

export interface CounterModel {
  count: number;
  increment: Action<CounterModel>;
  decrement: Action<CounterModel>;
  incrementIfOdd: Action<CounterModel>;
  incrementAsync: Thunk<CounterModel, number | void>;
}

const counterModel: CounterModel = {
  // state vars
  count: 0,
  // reducer actions (mutations allowed thx to immer)
  increment: action(state => {
    state.count++;
    info(`Incremented count in redux state to ${state.count}`);
  }),
  decrement: action(state => {
    state.count = state.count - 1;
    info(`Decremented count in redux state to ${state.count}`);
  }),
  incrementIfOdd: action(state => {
    info(`Incrementing count in redux state by 2 if "${state.count}" is odd`);
    if (state.count % 2 !== 0) {
      state.count += 2;
      info(`Incremented count in redux state to ${state.count}`);
    }
  }),
  incrementAsync: thunk(async (actions, payload, { getState }) => {
    info(`Incremented count in redux state asynchronously`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (getState().count !== 3) {
          actions.increment();
          resolve();
        } else {
          info(`Failed to increment count because it is currently ${getState().count}`);
          reject(new Error(i18n.t('models.counter.increment-async.error')));
        }
      }, payload || 1000);
    });
  }),
};

export default counterModel;
