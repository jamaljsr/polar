import React from 'react';
import { QrcodeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TaroNode } from 'shared/types';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    width: 100%;
  `,
};
interface Props {
  node: TaroNode;
  type?: 'button' | 'menu';
}

const OpenSendAssetModal: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.NewAddressButton');
  const { showNewAddress } = useStoreActions(s => s.modals);

  if (type === 'menu') {
    return (
      <div onClick={() => showNewAddress({ nodeName: node.name })}>
        <QrcodeOutlined />
        <span>{l('newAddress')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Styled.Button
        onClick={() => showNewAddress({ nodeName: node.name })}
        icon={<QrcodeOutlined />}
      >
        {l('newAddress')}
      </Styled.Button>
    </Form.Item>
  );
};

export default OpenSendAssetModal;
