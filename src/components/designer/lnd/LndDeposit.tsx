import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Button, Form, Input, InputNumber } from 'antd';
import { useStoreActions } from 'store';
import { LndNode } from 'types';

const InputGroup = Input.Group;

const LndDeposit: React.FC<{ node: LndNode }> = ({ node }) => {
  const [amount, setAmount] = useState(100000);
  const { depositFunds } = useStoreActions(s => s.lnd);
  const depositAsync = useAsyncCallback(
    async () => await depositFunds({ node, sats: amount.toString() }),
  );

  return (
    <>
      {depositAsync.error && (
        <Alert
          type="error"
          showIcon
          closable={false}
          message={`Unable to deposit funds`}
          description={depositAsync.error.message}
        />
      )}
      {depositAsync.status === 'success' && (
        <Alert type="success" showIcon closable message={`Deposit successful`} />
      )}
      <Form.Item label="Deposit Funds (satoshis)">
        <InputGroup compact>
          <InputNumber
            value={amount}
            min={1}
            max={100 * 100000000}
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
    </>
  );
};

export default LndDeposit;
