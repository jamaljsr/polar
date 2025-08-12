import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import React, { useEffect } from 'react';
import {
  ArkNode,
  BitcoinNode,
  CommonNode,
  LightningNode,
  Status,
  TapNode,
} from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: CommonNode;
  type?: 'button' | 'menu';
}

const RemoveNode: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.RemoveNode');
  const { notify } = useStoreActions(s => s.app);
  const { removeLightningNode, removeBitcoinNode, removeTapNode, removeArkNode } =
    useStoreActions(s => s.network);

  let modal: any;
  const showRemoveModal = () => {
    const { name } = node;
    modal = Modal.confirm({
      title: l('confirmTitle', { name }),
      content: (
        <>
          <p>{l(`confirm${node.type[0].toUpperCase()}${node.type.substring(1)}`)}</p>
          {node.type === 'bitcoin' && node.status === Status.Started && (
            <p>{l('restartText')}</p>
          )}
        </>
      ),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          switch (node.type) {
            case 'lightning':
              await removeLightningNode({ node: node as LightningNode });
              break;
            case 'bitcoin':
              await removeBitcoinNode({ node: node as BitcoinNode });
              break;
            case 'tap':
              await removeTapNode({ node: node as TapNode });
              break;
            case 'ark':
              await removeArkNode({ node: node as ArkNode });
              break;
            default:
              throw new Error(l('invalidType', { type: node.type }));
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
