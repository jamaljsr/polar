import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Alert, Button, Form, Input, InputNumber } from 'antd';
import { useStoreActions } from 'store';
import { LndNode } from 'types';

const InputGroup = Input.Group;

const Styled = {
  LndDeposit: styled.div`
    margin-top: 30px;
  `,
};

const LndDeposit: React.FC<{ node: LndNode }> = ({ node }) => {
  const [amount, setAmount] = useState(1);
  const { depositFunds } = useStoreActions(s => s.lnd);
  const depositAsync = useAsyncCallback(async () => await depositFunds({ node, amount }));

  return (
    <Styled.LndDeposit>
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
      <Form.Item label="Deposit BTC">
        <InputGroup compact>
          <InputNumber
            value={amount}
            min={1}
            max={1000}
            onChange={v => v && setAmount(v)}
            style={{ width: '65%' }}
          />
          <Button
            onClick={depositAsync.execute}
            loading={depositAsync.loading}
            style={{ width: '35%' }}
            icon="download"
          >
            Send
          </Button>
        </InputGroup>
      </Form.Item>
    </Styled.LndDeposit>
  );
};

export default LndDeposit;
