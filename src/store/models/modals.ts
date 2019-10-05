import { Action, action, Thunk, thunk } from 'easy-peasy';
import { StoreInjections } from 'types';
import { RootModel } from './';

interface OpenChannelModel {
  visible: boolean;
  to?: string;
  from?: string;
  linkId?: string;
}

export interface ModalsModel {
  openChannel: OpenChannelModel;
  setOpenChannel: Action<ModalsModel, OpenChannelModel>;
  showOpenChannel: Thunk<ModalsModel, Partial<OpenChannelModel>, StoreInjections>;
  hideOpenChannel: Thunk<ModalsModel, boolean, StoreInjections, RootModel>;
}

const modalsModel: ModalsModel = {
  openChannel: {
    visible: false,
    to: undefined,
    from: undefined,
    linkId: undefined,
  },
  setOpenChannel: action((state, payload) => {
    state.openChannel = {
      ...state.openChannel,
      ...payload,
    };
  }),
  showOpenChannel: thunk((actions, { to, from, linkId }) => {
    actions.setOpenChannel({ visible: true, to, from, linkId });
  }),
  hideOpenChannel: thunk((actions, success, { getStoreActions, getState }) => {
    const { linkId } = getState().openChannel;
    if (!success && linkId) {
      // remove the link on the chart it the channel was not opened
      getStoreActions().designer.removeLink(linkId);
    }
    actions.setOpenChannel({
      visible: false,
      to: undefined,
      from: undefined,
      linkId: undefined,
    });
  }),
};

export default modalsModel;
