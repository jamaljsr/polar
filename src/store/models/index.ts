import appModel, { AppModel } from './app';
import bitcoinModel, { BitcoinModel } from './bitcoin';
import designerModel, { DesignerModel } from './designer';
import lightningModel, { LightningModel } from './lightning';
import litModel, { LitModel } from './lit';
import mcpModel, { McpModel } from './mcp';
import modalsModel, { ModalsModel } from './modals';
import networkModel, { NetworkModel } from './network';
import tapModel, { TapModel } from './tap';

export interface RootModel {
  app: AppModel;
  network: NetworkModel;
  bitcoin: BitcoinModel;
  lightning: LightningModel;
  tap: TapModel;
  lit: LitModel;
  designer: DesignerModel;
  modals: ModalsModel;
  mcp: McpModel;
}

export const createModel = (): RootModel => {
  const rootModel: RootModel = {
    app: appModel,
    network: networkModel,
    bitcoin: bitcoinModel,
    lightning: lightningModel,
    tap: tapModel,
    lit: litModel,
    designer: designerModel,
    modals: modalsModel,
    mcp: mcpModel,
  };
  return rootModel;
};
