import React from 'react';
import { QrcodeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TaroNode } from 'shared/types';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    width: 50%;
  `,
};
interface Props {
  isContextMenu?: boolean;
  node: TaroNode;
}

const OpenSendAssetModal: React.FC<Props> = ({ node, isContextMenu }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.ActionsTab.NewAddress');
  const { showNewAddress } = useStoreActions(s => s.modals);
  const sendLabel = l('create');

  const sideMenuButton = (
    <Styled.Button
      onClick={() => showNewAddress({ nodeName: node.name })}
      icon={<QrcodeOutlined />}
    >
      {sendLabel}
    </Styled.Button>
  );
  const contextMenuButton = (
    <div onClick={() => showNewAddress({ nodeName: node.name })}>
      <QrcodeOutlined />
      <span>{sendLabel}</span>
    </div>
  );

  return isContextMenu ? contextMenuButton : sideMenuButton;
};

export default OpenSendAssetModal;
