import { Action, action, Thunk, thunk } from 'easy-peasy';
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
  nodeName?: string;
  invoice?: string;
  amount?: number;
}

interface PayInvoiceModel {
  visible: boolean;
  nodeName?: string;
}

export interface ModalsModel {
  openChannel: OpenChannelModel;
  createInvoice: CreateInvoiceModel;
  payInvoice: PayInvoiceModel;
  setOpenChannel: Action<ModalsModel, OpenChannelModel>;
  showOpenChannel: Thunk<ModalsModel, Partial<OpenChannelModel>, StoreInjections>;
  hideOpenChannel: Thunk<ModalsModel, any, StoreInjections, RootModel>;
  setCreateInvoice: Action<ModalsModel, CreateInvoiceModel>;
  showCreateInvoice: Thunk<ModalsModel, Partial<CreateInvoiceModel>, StoreInjections>;
  hideCreateInvoice: Thunk<ModalsModel, any, StoreInjections, RootModel>;
  setPayInvoice: Action<ModalsModel, PayInvoiceModel>;
  showPayInvoice: Thunk<ModalsModel, Partial<PayInvoiceModel>, StoreInjections>;
  hidePayInvoice: Thunk<ModalsModel, any, StoreInjections, RootModel>;
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
  payInvoice: {
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
  showCreateInvoice: thunk((actions, { nodeName, invoice, amount }) => {
    actions.setCreateInvoice({ visible: true, nodeName, invoice, amount });
  }),
  hideCreateInvoice: thunk(actions => {
    actions.setCreateInvoice({
      visible: false,
      nodeName: undefined,
      invoice: undefined,
      amount: undefined,
    });
  }),
  setPayInvoice: action((state, payload) => {
    state.payInvoice = {
      ...state.payInvoice,
      ...payload,
    };
  }),
  showPayInvoice: thunk((actions, { nodeName }) => {
    actions.setPayInvoice({ visible: true, nodeName });
  }),
  hidePayInvoice: thunk(actions => {
    actions.setPayInvoice({
      visible: false,
      nodeName: undefined,
    });
  }),
};

export default modalsModel;
