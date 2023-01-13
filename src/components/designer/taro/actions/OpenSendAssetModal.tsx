import React from 'react';
import { WalletOutlined } from '@ant-design/icons';
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
  const { l } = usePrefixedTranslation('cmps.designer.taro.ActionsTab.MintAsset');
  const { showSendAsset } = useStoreActions(s => s.modals);
  const sendLabel = l('send');

  const sideMenuButton = (
    <Styled.Button onClick={() => showSendAsset()} icon={<WalletOutlined />}>
      {sendLabel}
    </Styled.Button>
  );
  const contextMenuButton = (
    <div onClick={() => showSendAsset()}>
      <WalletOutlined />
      <span>{sendLabel}</span>
    </div>
  );

  return isContextMenu ? contextMenuButton : sideMenuButton;
};

export default OpenSendAssetModal;
