import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';
import { format } from 'utils/units';

const InputGroup = Input.Group;

const Deposit: React.FC<{ node: LightningNode }> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.actions.Deposit');
  const [amount, setAmount] = useState(1000000);
  const { notify } = useStoreActions(s => s.app);
  const { depositFunds } = useStoreActions(s => s.lightning);
  const depositAsync = useAsyncCallback(async () => {
    try {
      await depositFunds({ node, sats: amount.toString() });
      notify({
        message: l('depositSuccess', { amount: format(amount), node: node.name }),
      });
    } catch (error: any) {
      notify({ message: l('depositError'), error });
    }
  });

  return (
    <Form.Item label={l('title')} colon={false}>
      <InputGroup compact>
        <InputNumber
          value={amount}
          max={100 * 100000000}
          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
          onChange={v => setAmount(parseInt((v as any) || 1000000))}
          style={{ width: '65%' }}
        />
        <Button
          onClick={depositAsync.execute}
          loading={depositAsync.loading}
          style={{ width: '35%' }}
          icon={<DownloadOutlined />}
        >
          {l('depositBtn')}
        </Button>
      </InputGroup>
    </Form.Item>
  );
};

export default Deposit;
