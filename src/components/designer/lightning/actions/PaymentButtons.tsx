import React from 'react';
import styled from '@emotion/styled';
import { FileProtectOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    width: 50%;
  `,
};

interface Props {
  node: LightningNode;
}

const PaymentButtons: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.actions.PaymentButtons');
  const { showPayInvoice, showCreateInvoice } = useStoreActions(s => s.modals);

  return (
    <Form.Item label={l('paymentsTitle')} colon={false}>
      <Button.Group style={{ width: '100%' }}>
        <Styled.Button onClick={() => showPayInvoice({ nodeName: node.name })}>
          <ThunderboltOutlined />
          {l('payInvoice')}
        </Styled.Button>
        <Styled.Button onClick={() => showCreateInvoice({ nodeName: node.name })}>
          <FileProtectOutlined />
          {l('createInvoice')}
        </Styled.Button>
      </Button.Group>
    </Form.Item>
  );
};

export default PaymentButtons;
