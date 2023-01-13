import React from 'react';
import styled from '@emotion/styled';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TaroNode } from 'shared/types';
import OpenMintAssetModal from './OpenMintAssetModal';
import OpenNewAddressModal from './OpenNewAddressModal';
import OpenSendAssetModal from './OpenSendAssetModal';

const Styled = {
  Button: styled(Button)`
    width: 50%;
  `,
  Spacer: styled.div`
    height: 12px;
  `,
};

interface Props {
  node: TaroNode;
}

const AssetButtons: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.ActionsTab.MintAsset');

  return (
    <Form.Item label={l('title')} colon={false}>
      <OpenMintAssetModal node={node} />
      <Styled.Spacer />
      <OpenNewAddressModal />
      {/* <Styled.Spacer />
      <OpenSendAssetModal /> */}
    </Form.Item>
  );
};

export default AssetButtons;
