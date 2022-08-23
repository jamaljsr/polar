import React from 'react';
import { FileProtectOutlined, ThunderboltOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Form } from 'antd';
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
  menuType?: 'pay' | 'create';
}

const PaymentButtons: React.FC<Props> = ({ node, menuType }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.actions.PaymentButtons');
  const { showPayInvoice, showCreateInvoice } = useStoreActions(s => s.modals);

  // render a menu item inside of the NodeContextMenu
  if (menuType) {
    const icon = menuType === 'pay' ? <ThunderboltOutlined /> : <FileProtectOutlined />;
    const action = menuType === 'pay' ? showPayInvoice : showCreateInvoice;
    return (
      <div onClick={() => action({ nodeName: node.name })}>
        {icon}
        <span>{l(`${menuType}Invoice`)}</span>
      </div>
    );
  }

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
