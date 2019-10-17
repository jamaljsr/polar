import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Alert, Button, Form, Input, InputNumber } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { BitcoinNode } from 'types';

const InputGroup = Input.Group;

const Styled = {
  FormItem: styled(Form.Item)`
    margin-top: 30px;
  `,
};

const MineBlocksInput: React.FC<{ node: BitcoinNode }> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.MineBlocksInput');
  const [value, setValue] = useState(6);
  const { mine } = useStoreActions(s => s.bitcoind);
  const mineAsync = useAsyncCallback(mine);

  return (
    <>
      <Styled.FormItem label={l('label')}>
        <InputGroup compact>
          <InputNumber
            value={value}
            min={1}
            max={1000}
            onChange={v => v && setValue(v)}
            style={{ width: '65%' }}
          />
          <Button
            onClick={() => mineAsync.execute({ blocks: value, node })}
            loading={mineAsync.loading}
            style={{ width: '35%' }}
            icon="tool"
          >
            {l('btn')}
          </Button>
        </InputGroup>
      </Styled.FormItem>
      {mineAsync.error && (
        <Alert
          type="error"
          showIcon
          closable={false}
          message={l('error')}
          description={mineAsync.error.message}
        />
      )}
    </>
  );
};

export default MineBlocksInput;
