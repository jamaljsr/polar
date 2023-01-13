import React from 'react';
import { WalletOutlined } from '@ant-design/icons';
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
  node: TaroNode;
  isContextMenu?: boolean;
}

const OpenMintAssetModal: React.FC<Props> = ({ node, isContextMenu }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.ActionsTab.MintAsset');
  const { showMintAsset } = useStoreActions(s => s.modals);

  const sideMenuButton = (
    <Styled.Button
      onClick={() => showMintAsset({ nodeName: node.name })}
      icon={<WalletOutlined />}
    >
      {l('mint')}
    </Styled.Button>
  );
  const contextMenuButton = (
    <div onClick={() => showMintAsset({ nodeName: node.name })}>
      <WalletOutlined />
      <span>{l('mint')}</span>
    </div>
  );

  return isContextMenu ? contextMenuButton : sideMenuButton;
};

export default OpenMintAssetModal;
