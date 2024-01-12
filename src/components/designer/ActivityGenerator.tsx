import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button, Col, Form, InputNumber, Row, Select, Slider } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { Network } from 'types';

const Styled = {
  ActivityGen: styled.div`
    display: flex;
    flex-direction: column;
    row-gap: 10px;
    align-items: start;
    width: 100%;
    border-radius: 4px;
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
};

interface Props {
  visible: boolean;
  activities: any;
  networkNodes: Network['nodes'];
}

const ActivityGenerator: React.FC<Props> = ({ visible, networkNodes }) => {
  if (!visible) return null;
  const { l } = usePrefixedTranslation('cmps.designer.ActivityGenerator');
  const { lightning } = networkNodes;

  const [sourceNode, setSourceNode] = useState<LightningNode | undefined>(undefined);
  const [targetNode, setTargetNode] = useState<LightningNode | undefined>(undefined);
  const [amount, setAmount] = useState<number>(1);
  const [frequency, setFrequency] = useState<number>(1);

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
