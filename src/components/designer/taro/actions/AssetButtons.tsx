import React, { useState } from 'react';

import styled from '@emotion/styled';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TaroNode } from 'shared/types';
import { useStoreActions } from 'store';
import { WalletOutlined, ExportOutlined } from '@ant-design/icons';

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
  const { showMintAsset } = useStoreActions(s => s.modals);
  const [helpMessage, setHelpMessage] = useState('');
  return (
    <Form.Item label={l('title')} colon={false} help={helpMessage}>
      <Styled.Button
        onClick={() => showMintAsset({ nodeName: node.name })}
        icon={<WalletOutlined />}
        onMouseOver={() => setHelpMessage(l('mintAssetHelp'))}
      >
        {l('mint')}
      </Styled.Button>
      <Styled.Button
        onClick={() => showMintAsset({ nodeName: node.name })}
        icon={<ExportOutlined />}
        onMouseOver={() => setHelpMessage(l('sendAssetHelp'))}
      >
        {l('send')}
      </Styled.Button>
    </Form.Item>
  );
};

export default AssetButtons;
