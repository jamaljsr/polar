import React from 'react';
import { QrcodeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    width: 50%;
  `,
};
interface Props {
  isContextMenu?: boolean;
}

const OpenSendAssetModal: React.FC<Props> = ({ isContextMenu }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.ActionsTab.NewAddress');
  const { showNewAddress } = useStoreActions(s => s.modals);
  const sendLabel = l('create');

  const sideMenuButton = (
    <Styled.Button onClick={() => showNewAddress()} icon={<QrcodeOutlined />}>
      {sendLabel}
    </Styled.Button>
  );
  const contextMenuButton = (
    <div onClick={() => showNewAddress()}>
      <QrcodeOutlined />
      <span>{sendLabel}</span>
    </div>
  );

  return isContextMenu ? contextMenuButton : sideMenuButton;
};

export default OpenSendAssetModal;
