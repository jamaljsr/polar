import { createStore } from 'easy-peasy';
import { Status } from 'types';
import { injections } from 'utils/tests';
import designerModel from './designer';
import networkModel from './network';

describe('Designer model', () => {
  const rootModel = {
    network: networkModel,
    designer: designerModel,
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('with default state', () => {
    it('should have the correct default state', () => {
      const { activeId, allCharts, activeChart } = store.getState().designer;
      expect(activeId).toBe(-1);
      expect(activeChart).toBeUndefined();
      expect(allCharts).toEqual({});
    });

    it('should throw when setting an invalid chart as active', () => {
      const { setActiveId } = store.getActions().designer;
      expect(() => setActiveId(99)).toThrow(/Chart not found/);
    });
  });

  describe('with charts', () => {
    // helper to get the first network in the store
    const firstNetwork = () => store.getState().network.networks[0];
    const firstChart = () => store.getState().designer.allCharts[firstNetwork().id];

    beforeEach(() => {
      const { addNetwork } = store.getActions().network;
      addNetwork({ name: 'test', lndNodes: 2, bitcoindNodes: 1 });
    });

    it('should have a chart in state', () => {
      const { activeId, allCharts, activeChart } = store.getState().designer;
      const chart = allCharts[firstNetwork().id];
      expect(activeId).toBe(-1);
      expect(activeChart).toBeUndefined();
      expect(chart).not.toBeUndefined();
      expect(Object.keys(chart.nodes)).toHaveLength(3);
    });

    it('should set the active chart', () => {
      store.getActions().designer.setActiveId(firstNetwork().id);
      const { activeId, activeChart } = store.getState().designer;
      expect(activeId).toBe(firstNetwork().id);
      expect(activeChart).not.toBeUndefined();
      expect(Object.keys(activeChart.nodes)).toHaveLength(3);
    });

    it('should update the nodes status when the network is updated', () => {
      let chart = firstChart();
      Object.keys(chart.nodes).forEach(name =>
        expect(chart.nodes[name].properties.status).toBe(Status.Stopped),
      );
      const { setStatus } = store.getActions().network;
      setStatus({ id: firstNetwork().id, status: Status.Started, all: true });
      chart = firstChart();
      Object.keys(chart.nodes).forEach(name =>
        expect(chart.nodes[name].properties.status).toBe(Status.Started),
      );
    });
  });
});
