import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LightningNode } from 'shared/types';
import { StoreInjections } from 'types';
import { RootModel } from './';

interface OpenChannelModel {
  visible: boolean;
  to?: string;
  from?: string;
  linkId?: string;
}

interface CreateInvoiceModel {
  visible: boolean;
  node?: LightningNode;
}

export interface ModalsModel {
  openChannel: OpenChannelModel;
  createInvoice: CreateInvoiceModel;
  setOpenChannel: Action<ModalsModel, OpenChannelModel>;
  showOpenChannel: Thunk<ModalsModel, Partial<OpenChannelModel>, StoreInjections>;
  hideOpenChannel: Thunk<ModalsModel, any, StoreInjections, RootModel>;
  setCreateInvoice: Action<ModalsModel, CreateInvoiceModel>;
  showCreateInvoice: Thunk<ModalsModel, { node: LightningNode }, StoreInjections>;
  hideCreateInvoice: Thunk<ModalsModel, any, StoreInjections, RootModel>;
}

const modalsModel: ModalsModel = {
  openChannel: {
    visible: false,
    to: undefined,
    from: undefined,
    linkId: undefined,
  },
  createInvoice: {
    visible: false,
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
  hideOpenChannel: thunk((actions, payload, { getStoreActions, getState }) => {
    const { linkId } = getState().openChannel;
    if (linkId) {
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
  setCreateInvoice: action((state, payload) => {
    state.createInvoice = {
      ...state.createInvoice,
      ...payload,
    };
  }),
  showCreateInvoice: thunk((actions, { node }) => {
    actions.setCreateInvoice({ visible: true, node });
  }),
  hideCreateInvoice: thunk(actions => {
    actions.setCreateInvoice({
      visible: false,
      node: undefined,
    });
  }),
};

export default modalsModel;
