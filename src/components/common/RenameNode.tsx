import React, { useState } from 'react';
import { FormOutlined } from '@ant-design/icons';
import { Button, Form, Modal, Input } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, CommonNode, LightningNode, TapNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: CommonNode;
  type?: 'button' | 'menu';
}

const RenameNode: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.RenameNode');
  const { notify } = useStoreActions(s => s.app);
  const { renameBitcoinNode, renameTapNode, renameLightningNode } = useStoreActions(
    s => s.network,
  );

  const [editingName, setEditingName] = useState(node.name);
  const [modalVisible, setModalVisible] = useState(false);

  const handleInputChange = (e: { target: { value: React.SetStateAction<string> } }) => {
    setEditingName(e.target.value);
  };

  const onClose = () => {
    setModalVisible(false);
  };

  const handleOk = async () => {
    try {
      switch (node.type) {
        case 'lightning':
          await renameLightningNode({
            node: node as LightningNode,
            newName: editingName,
          });
          break;
        case 'bitcoin':
          await renameBitcoinNode({ node: node as BitcoinNode, newName: editingName });
          break;
        case 'tap':
          await renameTapNode({
            node: node as TapNode,
            newName: editingName,
          });
          break;
        default:
          throw new Error(l('invalidType', { type: node.type }));
      }
      notify({ message: l('success', { name }) });
    } catch (error: any) {
      notify({ message: l('error'), error });
      throw error;
    }
    onClose();
  };

  const handleEditNode = () => {
    setModalVisible(true);
  };

  if (type === 'menu') {
    return (
      <>
        <div onClick={handleEditNode}>
          <FormOutlined />
          <span>{l('btnText')}</span>
        </div>
        {modalVisible && (
          <Modal
            title={l('confirmTitle')}
            open={modalVisible}
            onOk={handleOk}
            onCancel={onClose}
          >
            <Input
              value={editingName}
              onChange={handleInputChange}
              placeholder="Enter node name"
            />
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <Form.Item label={l('title')} colon={false}>
        <Button
          block
          ghost
          onClick={() => {
            handleEditNode();
          }}
        >
          {l('btnText')}
        </Button>
      </Form.Item>
      {modalVisible && (
        <Modal
          title={l('confirmTitle')}
          open={modalVisible}
          onOk={handleOk}
          onCancel={onClose}
        >
          <Input
            value={editingName}
            onChange={handleInputChange}
            placeholder="Enter node name"
          />
        </Modal>
      )}
    </>
  );
};

export default RenameNode;
