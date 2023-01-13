import React from 'react';
import styled from '@emotion/styled';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TaroNode } from 'shared/types';
import { default as OpenMintAssetModal } from './OpenMintAssetModal';

const Styled = {
  Button: styled(Button)`
    width: 50%;
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
      {/* <Styled.Button
        onClick={() => showMintAsset({ nodeName: node.name })}
        icon={<ExportOutlined />}
      >
        {l('send')}
      </Styled.Button> */}
    </Form.Item>
  );
};

export default AssetButtons;
