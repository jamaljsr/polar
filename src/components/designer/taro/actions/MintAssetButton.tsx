import React from 'react';
import { WalletOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Form } from 'antd';
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
  type?: 'button' | 'menu';
}

const MintAssetButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.MintAssetButton');
  const { showMintAsset } = useStoreActions(s => s.modals);

  if (type === 'menu') {
    return (
      <div onClick={() => showMintAsset({ nodeName: node.name })}>
        <WalletOutlined />
        <span>{l('mint')}</span>
      </div>
    );
  }
  return (
    <Form.Item label={l('title')} colon={false}>
      <Styled.Button
        onClick={() => showMintAsset({ nodeName: node.name })}
        icon={<WalletOutlined />}
      >
        {l('mint')}
      </Styled.Button>
    </Form.Item>
  );
};

export default MintAssetButton;
