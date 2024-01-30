import React, { useState } from 'react';
import { PlusSquareOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Col, Form, InputNumber, Row, Select, Slider } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CLightningNode, LightningNode, LndNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network, SimulationActivityNode } from 'types';

const Styled = {
  ActivityGen: styled.div`
    display: flex;
    flex-direction: column;
    row-gap: 10px;
    align-items: start;
    width: 100%;
    border-radius: 4px;
  `,
  AddActivity: styled(Button)<{ canAdd: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    border: none;
    font-size: 100px;
    color: #fff;
    cursor: ${props => (props.canAdd ? 'pointer' : 'not-allowed')};
    opacity: ${props => (props.canAdd ? '1' : '0.6')};

    svg {
      font-size: 33px;
      color: ${props => (props.canAdd ? '#d46b08' : '#545353e6')};
    }
  `,
  Divider: styled.div`
    height: 1px;
    width: 100%;
    margin: 15px 0;
    background: #545353e6;
    opacity: 0.5;
  `,
  DeleteButton: styled(Button)`
    border: none;
    height: 100%;
    color: red;
    opacity: 0.6;

    &:hover {
      background: red;
      color: #fff;
      border: 1px solid #fff;
    }
  `,
  AmountInput: styled(InputNumber)`
    width: 100%;
    border-radius: 4px;
    margin: 0 0 10px 0;
    padding: 5px 0;
  `,
  ActivityForm: styled(Form)`
    display: flex;
    flex-direction: column;
    row-gap: 10px;
    align-items: start;
    width: 100%;
    border-radius: 4px;
    border: 1px solid #545353e6;
    padding: 10px;
  `,
  Label: styled.p`
    margin: 0;
    padding: 0;
  `,
  NodeWrapper: styled.div`
    display: flex;
    align-items: center;
    justify-content: start;
    column-gap: 15px;
    width: 100%;
  `,
  NodeSelect: styled(Select)`
    width: 100%;
    border-radius: 4px;
    margin: 0 0 10px 0;
  `,
  Save: styled(Button)<{ canSave: boolean }>`
    border: 1px solid #545353e6;
    width: 100%;
    height: 100%;
    color: #fff;
    opacity: ${props => (props.canSave ? '1' : '0.6')};
    cursor: ${props => (props.canSave ? 'pointer' : 'not-allowed')};

    &:hover {
      background: ${props => (props.canSave ? '#d46b08' : '')};
      color: #fff;
      border: 1px solid #fff;
    }
  `,
  Cancel: styled(Button)`
    height: 100%;
    width: 100%;
    color: #fff;
    opacity: 0.6;
    background: #000;
    border: 1px solid red;

    &:hover {
      background: red;
      color: #fff;
      border: 1px solid #fff;
    }
  `,
};

interface Props {
  visible: boolean;
  activities: any;
  network: Network;
}

const ActivityGenerator: React.FC<Props> = ({ visible, network }) => {
  if (!visible) return null;
  const { l } = usePrefixedTranslation('cmps.designer.ActivityGenerator');
  const nodeState = useStoreState(s => s.lightning);
  const { lightning } = network.nodes;

  const [sourceNode, setSourceNode] = useState<LightningNode | undefined>(undefined);
  const [targetNode, setTargetNode] = useState<LightningNode | undefined>(undefined);
  const [amount, setAmount] = useState<number>(1);
  const [frequency, setFrequency] = useState<number>(1);

  // get store actions for adding activities
  const store = useStoreActions(s => s.network);

  const getAuthDetails = (node: LightningNode) => {
    const id = nodeState && nodeState.nodes[node.name].info?.pubkey;

    switch (node.implementation) {
      case 'LND':
        const lnd = node as LndNode;
        return {
          id,
          macaroon: lnd.paths.adminMacaroon,
          tlsCert: lnd.paths.tlsCert,
          clientCert: lnd.paths.tlsCert,
          clientKey: '',
          address: `https://host.docker.internal:${lnd.ports.grpc}`,
        };
      case 'c-lightning':
        const cln = node as CLightningNode;
        return {
          id,
          macaroon: cln.paths.macaroon,
          tlsCert: cln.paths.tlsCert,
          clientCert: cln.paths.tlsClientCert,
          clientKey: cln.paths.tlsClientKey,
          address: `https://host.docker.internal:${cln.ports.grpc}`,
        };
      default:
        return {
          id,
          macaroon: '',
          tlsCert: '',
          clientCert: '',
          clientKey: '',
          address: '',
        };
    }
  };

  const handleAddActivity = () => {
    if (!sourceNode || !targetNode) return;
    const sourceSimulationNode: SimulationActivityNode = {
      id: getAuthDetails(sourceNode).id || '',
      label: sourceNode.name,
      type: sourceNode.implementation,
      address: getAuthDetails(sourceNode).address,
      macaroon: getAuthDetails(sourceNode).macaroon,
      tlsCert: getAuthDetails(sourceNode).tlsCert || '',
      clientCert: getAuthDetails(sourceNode).clientCert,
      clientKey: getAuthDetails(sourceNode).clientKey,
    };
    const targetSimulationNode: SimulationActivityNode = {
      id: getAuthDetails(targetNode).id || '',
      label: targetNode.name,
      type: targetNode.implementation,
      address: getAuthDetails(targetNode).address,
      macaroon: getAuthDetails(targetNode).macaroon,
      tlsCert: getAuthDetails(targetNode).tlsCert || '',
      clientCert: getAuthDetails(targetNode).clientCert,
      clientKey: getAuthDetails(targetNode).clientKey,
    };
    const activity = {
      source: sourceSimulationNode,
      destination: targetSimulationNode,
      amountMsat: amount,
      intervalSecs: frequency,
      networkId: network.id,
    };
    // const newActivities = [...network.simulationActivities, activity];
    // network.simulationActivities.push(activity);
    store.addSimulationActivity(activity);
    console.log('activity', activity);
    console.log('network', network.simulationActivities);
  };

  const handleSourceNodeChange = (selectedNodeName: string) => {
    const selectedNode = lightning.find(n => n.name === selectedNodeName);
    if (selectedNode?.name !== targetNode?.name) {
      return setSourceNode(selectedNode);
    }
  };
  const handleTargetNodeChange = (selectedNodeName: string) => {
    const selectedNode = lightning.find(n => n.name === selectedNodeName);
    if (selectedNode?.name !== sourceNode?.name) {
      return setTargetNode(selectedNode);
    }
  };
  const handleFrequencyChange = (newValue: number) => {
    setFrequency(newValue);
  };

  const sourceNodes = React.useMemo(() => {
    return lightning.filter(n => !targetNode || n.id !== targetNode.id);
  }, [lightning, targetNode]);

  const targetNodes = React.useMemo(() => {
    return lightning.filter(n => !sourceNode || n.id !== sourceNode.id);
  }, [lightning, sourceNode]);

  React.useEffect(() => {
    if (amount !== undefined && amount <= 0) {
      setAmount(1);
    }
    if (frequency !== undefined && frequency <= 0) {
      setFrequency(1);
    }
  }, [amount, frequency]);

  return (
    <Styled.ActivityGen>
      <Styled.ActivityForm>
        <Styled.Label>{l('sourceNode')}</Styled.Label>
        <Styled.NodeSelect
          value={sourceNode?.name}
          onChange={e => handleSourceNodeChange(e as string)}
        >
          {sourceNodes.map(n => (
            <Select.Option key={`${n.id}-${n.name}`} value={n.name}>
              {n.name}
            </Select.Option>
          ))}
        </Styled.NodeSelect>

        <Styled.Label>{l('destinationNode')}</Styled.Label>
        <Styled.NodeSelect
          value={targetNode?.name}
          onChange={e => handleTargetNodeChange(e as string)}
        >
          {targetNodes.map(n => (
            <Select.Option key={`${n.id}-${n.name}`} value={n.name}>
              {n.name}
            </Select.Option>
          ))}
        </Styled.NodeSelect>

        <Styled.Label>{l('frequency')}</Styled.Label>
        <IntegerStep frequency={frequency} onChange={handleFrequencyChange} />

        <Styled.Label>{l('amount')}</Styled.Label>
        <Styled.AmountInput
          placeholder={l('amountPlaceholder')}
          value={amount}
          onChange={e => setAmount(e as number)}
        />

        <Styled.NodeWrapper>
          <Styled.AddActivity
            size="large"
            canAdd={!!sourceNode && !!targetNode}
            icon={<PlusSquareOutlined />}
          />
          <Styled.Save
            type="primary"
            canSave={!!sourceNode && !!targetNode}
            onClick={handleAddActivity}
          >
            {l('save')}
          </Styled.Save>
          <Styled.Cancel type="primary">{l('cancel')}</Styled.Cancel>
        </Styled.NodeWrapper>
      </Styled.ActivityForm>
    </Styled.ActivityGen>
  );
};

const IntegerStep: React.FC<{
  frequency: number;
  onChange: (newValue: number) => void;
}> = ({ frequency, onChange }) => {
  return (
    <Row
      style={{
        width: '100%',
      }}
    >
      <Col span={15}>
        <Slider
          min={1}
          max={100}
          range={false}
          onChange={onChange}
          value={typeof frequency === 'number' ? frequency : 0}
        />
      </Col>
      <Col span={4}>
        <InputNumber
          min={1}
          style={{ margin: '0 16px' }}
          value={frequency}
          onChange={(newValue: number | null) => onChange(newValue ?? 0)}
        />
      </Col>
    </Row>
  );
};

export default ActivityGenerator;
