import { Action, action, Thunk, thunk } from 'easy-peasy';
import { StoreInjections } from 'types';
import { RootModel } from './';

interface OpenChannelModel {
  visible: boolean;
  to?: string;
  from?: string;
  linkId?: string;
}

interface ChangeBackendModel {
  visible: boolean;
  lnName?: string;
  backendName?: string;
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

interface AdvancedOptionsModel {
  visible: boolean;
  nodeName?: string;
  command?: string;
  defaultCommand?: string;
}

export interface ModalsModel {
  openChannel: OpenChannelModel;
  changeBackend: ChangeBackendModel;
  createInvoice: CreateInvoiceModel;
  payInvoice: PayInvoiceModel;
  advancedOptions: AdvancedOptionsModel;
  setOpenChannel: Action<ModalsModel, OpenChannelModel>;
  showOpenChannel: Thunk<ModalsModel, Partial<OpenChannelModel>, StoreInjections>;
  hideOpenChannel: Thunk<ModalsModel, any, StoreInjections, RootModel>;
  setChangeBackend: Action<ModalsModel, ChangeBackendModel>;
  showChangeBackend: Thunk<ModalsModel, Partial<ChangeBackendModel>, StoreInjections>;
  hideChangeBackend: Thunk<ModalsModel, any, StoreInjections, RootModel>;
  setCreateInvoice: Action<ModalsModel, CreateInvoiceModel>;
  showCreateInvoice: Thunk<ModalsModel, Partial<CreateInvoiceModel>, StoreInjections>;
  hideCreateInvoice: Thunk<ModalsModel, any, StoreInjections, RootModel>;
  setPayInvoice: Action<ModalsModel, PayInvoiceModel>;
  showPayInvoice: Thunk<ModalsModel, Partial<PayInvoiceModel>, StoreInjections>;
  hidePayInvoice: Thunk<ModalsModel, any, StoreInjections, RootModel>;
  setAdvancedOptions: Action<ModalsModel, AdvancedOptionsModel>;
  showAdvancedOptions: Thunk<ModalsModel, Partial<AdvancedOptionsModel>, StoreInjections>;
  hideAdvancedOptions: Thunk<ModalsModel, any, StoreInjections, RootModel>;
}

const modalsModel: ModalsModel = {
  openChannel: { visible: false },
  changeBackend: { visible: false },
  createInvoice: { visible: false },
  payInvoice: { visible: false },
  advancedOptions: { visible: false },
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
      // remove the link on the chart if the channel was not opened
      getStoreActions().designer.removeLink(linkId);
    }
    actions.setOpenChannel({
      visible: false,
      to: undefined,
      from: undefined,
      linkId: undefined,
    });
  }),
  setChangeBackend: action((state, payload) => {
    state.changeBackend = {
      ...state.changeBackend,
      ...payload,
    };
  }),
  showChangeBackend: thunk((actions, { lnName, backendName, linkId }) => {
    actions.setChangeBackend({ visible: true, lnName, backendName, linkId });
  }),
  hideChangeBackend: thunk((actions, payload, { getStoreActions, getState }) => {
    const { linkId } = getState().changeBackend;
    if (linkId) {
      // remove the link on the chart if the backend wasn't changed
      getStoreActions().designer.removeLink(linkId);
    }
    actions.setChangeBackend({
      visible: false,
      lnName: undefined,
      backendName: undefined,
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
  setAdvancedOptions: action((state, payload) => {
    state.advancedOptions = {
      ...state.advancedOptions,
      ...payload,
    };
  }),
  showAdvancedOptions: thunk((actions, { nodeName, command, defaultCommand }) => {
    actions.setAdvancedOptions({ visible: true, nodeName, command, defaultCommand });
  }),
  hideAdvancedOptions: thunk(actions => {
    actions.setAdvancedOptions({
      visible: false,
      nodeName: undefined,
      command: undefined,
      defaultCommand: undefined,
    });
  }),
};

export default modalsModel;
