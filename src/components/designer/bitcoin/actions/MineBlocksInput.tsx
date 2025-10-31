import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { ToolOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Form, Input, InputNumber } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';

const InputGroup = Input.Group;

const Styled = {
  InputNumber: styled(InputNumber)`
    width: 65%;
  `,
  Button: styled(Button)`
    width: 35%;
  `,
};

const MineBlocksInput: React.FC<{ node: BitcoinNode }> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.MineBlocksInput');
  const network = useStoreState(s => s.network.networkById(node.networkId));
  const { notify } = useStoreActions(s => s.app);
  const { mine } = useStoreActions(s => s.bitcoin);
  const updateManualMineCount = useStoreActions(
    actions => actions.network.updateManualMineCount,
  );

  const mineAsync = useAsyncCallback(async () => {
    try {
      await mine({ blocks: network.manualMineCount, node });
    } catch (error: any) {
      notify({ message: l('error'), error });
    }
  });

  const handleManualMineCountChange = (count: number) => {
    updateManualMineCount({ id: node.networkId, count });
  };

  return (
    <Form.Item label={l('label')}>
      <InputGroup compact>
        <Styled.InputNumber
          value={network.manualMineCount}
          max={1000}
          onChange={v => handleManualMineCountChange(parseInt(v as any))}
          disabled={mineAsync.loading}
        />
        <Styled.Button
          onClick={mineAsync.execute}
          loading={mineAsync.loading}
          icon={<ToolOutlined />}
        >
          {l('btn')}
        </Styled.Button>
      </InputGroup>
    </Form.Item>
  );
};

export default MineBlocksInput;
