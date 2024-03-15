import React, { useEffect, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Modal, Input } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, CommonNode, LightningNode, TapNode } from 'shared/types';
import { useStoreActions } from 'store';
// import styled from '@emotion/styled';

interface Props {
  node: CommonNode;
  type?: 'button' | 'menu';
}

// const Styled = {
//   RenameInput: styled(Input)`
//     width: 100%;
//     margin-top: 12px;
//   `,
// };

const RenameNode: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.RenameNode');
  const { notify } = useStoreActions(s => s.app);
  const { removeBitcoinNode, removeTapNode, renameLightningNode } = useStoreActions(
    s => s.network,
  );

  const [editingName, setEditingName] = useState('');

  let modal: any;
  const showRenameModal = () => {
    modal = Modal.confirm({
      title: l('confirmTitle'),
      content: (
        <Input
          name="newNodeName"
          value={editingName}
          onChange={e => setEditingName(e.target.value)}
        />
      ),
      okText: l('confirmBtn'),
      okType: 'primary',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          switch (node.type) {
            case 'lightning':
              await renameLightningNode({
                node: node as LightningNode,
                newName: editingName,
              });
              break;
            case 'bitcoin':
              await removeBitcoinNode({ node: node as BitcoinNode });
              break;
            case 'tap':
              await removeTapNode({ node: node as TapNode });
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
      <div onClick={showRenameModal}>
        <CloseOutlined />
        <span>{l('btnText')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button
        block
        ghost
        onClick={() => {
          setEditingName(node.name);
          showRenameModal();
        }}
      >
        {l('btnText')}
      </Button>
    </Form.Item>
  );
};

export default RenameNode;
