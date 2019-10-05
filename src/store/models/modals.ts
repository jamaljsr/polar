import { Action, action } from 'easy-peasy';

export interface ModalsModel {
  openChannel: {
    visible: boolean;
    to?: string;
    from?: string;
  };
  showOpenChannel: Action<ModalsModel, { to?: string; from?: string }>;
  hideOpenChannel: Action<ModalsModel>;
}

const modalsModel: ModalsModel = {
  openChannel: {
    visible: false,
    to: '',
    from: '',
  },
  showOpenChannel: action((state, { to, from }) => {
    state.openChannel = { visible: true, to, from };
  }),
  hideOpenChannel: action(state => {
    state.openChannel = { visible: false, to: '', from: '' };
  }),
};

export default modalsModel;
