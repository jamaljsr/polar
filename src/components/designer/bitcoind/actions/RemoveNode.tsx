import React from 'react';
import { Button, Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, Status } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: BitcoinNode;
}

const RemoveNode: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.actions.RemoveNode');
  const { notify } = useStoreActions(s => s.app);
  const { removeBitcoinNode } = useStoreActions(s => s.network);

  const showRemoveModal = () => {
    const { name } = node;
    Modal.confirm({
      title: l('confirmTitle', { name }),
      content: (
        <>
          <p>{l('confirmText')}</p>
          {node.status === Status.Started && <p>{l('restartText')}</p>}
        </>
      ),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          await removeBitcoinNode({ node });
          notify({ message: l('success', { name }) });
        } catch (error) {
          notify({ message: l('error'), error });
          throw error;
        }
      },
    });
  };

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button type="danger" block ghost onClick={showRemoveModal}>
        {l('btnText')}
      </Button>
    </Form.Item>
  );
};

export default RemoveNode;
