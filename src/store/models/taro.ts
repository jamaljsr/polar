import { action, Action, thunk, Thunk, thunkOn, ThunkOn } from 'easy-peasy';
import { Status, TarodNode, TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { StoreInjections } from 'types';
import { RootModel } from './';
import { TarOptions } from 'archiver';
import * as TARO from 'shared/tarodTypes';
import { useStoreActions, useStoreState } from 'store';
import React, { useState } from 'react';

export interface TaroNodeMapping {
  [key: string]: TaroNodeModel;
}

export interface TaroNodeModel {
  assets?: PTARO.TaroAsset[];
  balances?: PTARO.TaroBalance[];
  batchKey?: string;
}

export interface TaroModel {
  nodes: TaroNodeMapping;
  removeNode: Action<TaroModel, string>;
  clearNodes: Action<TaroModel, void>;
  setAssets: Action<TaroModel, { node: TaroNode; assets: PTARO.TaroAsset[] }>;
  getAssets: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;
  setBalances: Action<TaroModel, { node: TaroNode; balances: PTARO.TaroBalance[] }>;
  getBalances: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;
  getAllInfo: Thunk<TaroModel, TaroNode, RootModel>;
  mineListener: ThunkOn<TaroModel, StoreInjections, RootModel>;
  mintAsset: Thunk<
    TaroModel,
    { node: TaroNode; req: TARO.MintAssetRequest },
    StoreInjections,
    RootModel
  >;
  setBatchKey: Action<TaroModel, { node: TaroNode; newBatchKey: string }>;
}

const taroModel: TaroModel = {
  // state properties
  nodes: {},
  // reducer actions (mutations allowed thx to immer)
  removeNode: action((state, name) => {
    if (state.nodes[name]) {
      delete state.nodes[name];
    }
  }),
  clearNodes: action(state => {
    state.nodes = {};
  }),
  setAssets: action((state, { node, assets }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].assets = assets;
  }),
  getAssets: thunk(async (actions, node, { injections }) => {
    const api = injections.taroFactory.getService(node);
    const assets = await api.listAssets(node);
    actions.setAssets({ node, assets });
  }),
  setBalances: action((state, { node, balances }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].balances = balances;
  }),
  getBalances: thunk(async (actions, node, { injections }) => {
    const api = injections.taroFactory.getService(node);
    const balances = await api.listBalances(node);
    actions.setBalances({ node, balances });
  }),
  getAllInfo: thunk(async (actions, node) => {
    await actions.getAssets(node);
    await actions.getBalances(node);
  }),

  mintAsset: thunk(async (actions, { node, req }, { injections }) => {
    const api = injections.taroFactory.getService(node);
    const res = await api.mintAsset(node, req);
    if (res.batchKey) {
      actions.setBatchKey({ node, newBatchKey: res.batchKey.toString('hex') });
    }
  }),
  setBatchKey: action((state, { node, newBatchKey }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].batchKey = newBatchKey;
  }),
  mineListener: thunkOn(
    (actions, storeActions) => storeActions.bitcoind.mine,
    async (actions, { payload }, { getStoreState, getStoreActions }) => {
      const { notify } = getStoreActions().app;
      // update all lightning nodes info when a block in mined
      const network = getStoreState().network.networkById(payload.node.networkId);
      await getStoreActions().lightning.waitForNodes(network.nodes.lightning);
      await Promise.all(
        network.nodes.taro
          .filter(n => n.status === Status.Started)
          .map(async n => {
            try {
              await actions.getAssets(n);
            } catch (error: any) {
              notify({ message: `Unable to retrieve assets for ${n.name}`, error });
            }
          }),
      );
    },
  ),
};

export default taroModel;
