import React from 'react';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Button, Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, CommonNode, LightningNode, Status } from 'shared/types';
import { useStoreActions } from 'store';
import { supportsTor } from 'utils/network';

interface Props {
  node: CommonNode;
  menuType?: 'enable' | 'disable';
}

const Styled = {
  Button: styled(Button)`
    width: 50%;
  `,
};

const TorButton: React.FC<Props> = ({ node, menuType }) => {
  const { l } = usePrefixedTranslation('cmps.common.TorButton');
  const { notify } = useStoreActions(s => s.app);
  const { toggleTorForNode } = useStoreActions(s => s.network);

  const disabled = [Status.Starting, Status.Stopping].includes(node.status);
  const isStarted = node.status === Status.Started;

  const isTorEnabled =
    node.type === 'lightning' || node.type === 'bitcoin'
      ? (node as LightningNode | BitcoinNode).enableTor
      : false;

  const showConfirmModal = (mode: string) => {
    const { name } = node;
    const enable = mode === 'enable';

    Modal.confirm({
      title: l(`${mode}ConfirmTitle`, { name }),
      content: isStarted ? <Alert type="warning" message={l('alert')} /> : null,
      okText: l(`confirmBtn`),
      okType: isStarted ? 'danger' : 'primary',
      cancelText: l(`cancelBtn`),
      onOk: async () => {
        try {
          await toggleTorForNode({ node, enabled: enable });
          notify({ message: l(`${mode}Success`, { name }) });
        } catch (error: any) {
          notify({ message: l(`${mode}Error`), error });
          throw error;
        }
      },
    });
  };

  // render a menu item inside of the NodeContextMenu
  if (menuType) {
    const icon = menuType === 'disable' ? <LockOutlined /> : <UnlockOutlined />;

    return (
      <div onClick={() => showConfirmModal(menuType)}>
        {icon}
        <span>{l(`${menuType}Btn`)}</span>
      </div>
    );
  }

  if (!supportsTor(node)) {
    return (
      <Form.Item label={l('title')} colon={false}>
        <Alert message={l('notSupported')} type="info" showIcon />
      </Form.Item>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button.Group style={{ width: '100%' }}>
        <Styled.Button
          disabled={disabled || !isTorEnabled}
          onClick={() => showConfirmModal('disable')}
        >
          <LockOutlined />
          {l('disableBtn')}
        </Styled.Button>
        <Styled.Button
          disabled={disabled || isTorEnabled}
          onClick={() => showConfirmModal('enable')}
        >
          <UnlockOutlined />
          {l('enableBtn')}
        </Styled.Button>
      </Button.Group>
    </Form.Item>
  );
};

export default TorButton;
