import React, { useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, CommonNode, LightningNode, Status } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: CommonNode;
  type?: 'button' | 'menu';
}

const RemoveNode: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.RemoveNode');
  const { notify } = useStoreActions(s => s.app);
  const { removeLightningNode, removeBitcoinNode } = useStoreActions(s => s.network);

  let modal: any;
  const showRemoveModal = () => {
    const isLN = node.type === 'lightning';
    const { name } = node;
    modal = Modal.confirm({
      title: l('confirmTitle', { name }),
      content: (
        <>
          <p>{l(isLN ? 'confirmLightning' : 'confirmBitcoin')}</p>
          {!isLN && node.status === Status.Started && <p>{l('restartText')}</p>}
        </>
      ),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          if (isLN) {
            await removeLightningNode({ node: node as LightningNode });
          } else {
            await removeBitcoinNode({ node: node as BitcoinNode });
          }
          notify({ message: l('success', { name }) });
        } catch (error: any) {
          notify({ message: l('error'), error });
          throw error;
        }
      },
    });
  };

  // cleanup the modal when the component unmounts
  useEffect(() => () => modal && modal.destroy(), [modal]);

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div onClick={showRemoveModal}>
        <CloseOutlined />
        <span>{l('btnText')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button type="primary" danger block ghost onClick={showRemoveModal}>
        {l('btnText')}
      </Button>
    </Form.Item>
  );
};

export default RemoveNode;
