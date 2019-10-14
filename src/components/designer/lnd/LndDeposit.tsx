import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Button, Form, Input, InputNumber } from 'antd';
import { useStoreActions } from 'store';
import { LndNode } from 'types';
import { format } from 'utils/units';

const InputGroup = Input.Group;

const LndDeposit: React.FC<{ node: LndNode }> = ({ node }) => {
  const [amount, setAmount] = useState(1000000);
  const { notify } = useStoreActions(s => s.app);
  const { depositFunds } = useStoreActions(s => s.lnd);
  const depositAsync = useAsyncCallback(async () => {
    try {
      await depositFunds({ node, sats: amount.toString() });
      notify({ message: `Deposited ${format(amount)} sats to ${node.name}` });
    } catch (error) {
      notify({ message: 'Unable to deposit funds', error });
    }
  });

  return (
    <Form.Item label="Deposit Funds (satoshis)">
      <InputGroup compact>
        <InputNumber
          value={amount}
          min={1}
          max={100 * 100000000}
          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={v => `${v}`.replace(/(undefined|,*)/g, '')}
          onChange={v => v && setAmount(v)}
          style={{ width: '65%' }}
        />
        <Button
          onClick={depositAsync.execute}
          loading={depositAsync.loading}
          style={{ width: '35%' }}
          icon="download"
        >
          Deposit
        </Button>
      </InputGroup>
    </Form.Item>
  );
};

export default LndDeposit;
