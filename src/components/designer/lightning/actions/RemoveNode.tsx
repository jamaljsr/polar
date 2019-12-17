import React, { useEffect } from 'react';
import { Button, Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: LightningNode;
}

const RemoveNode: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.actions.RemoveNode');
  const { notify } = useStoreActions(s => s.app);
  const { removeLightningNode } = useStoreActions(s => s.network);

  let modal: any;
  const showRemoveModal = () => {
    const { name } = node;
    modal = Modal.confirm({
      title: l('confirmTitle', { name }),
      content: (
        <>
          {l('confirmText')}
          <a onClick={() => Modal.destroyAll()}>destroyAll</a>
        </>
      ),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          await removeLightningNode({ node });
          notify({ message: l('success', { name }) });
        } catch (error) {
          notify({ message: l('error'), error });
          throw error;
        }
      },
    });
  };

  // cleanup the modal when the component unmounts
  useEffect(() => () => modal && modal.destroy(), [modal]);

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button type="danger" block ghost onClick={showRemoveModal}>
        {l('btnText')}
      </Button>
    </Form.Item>
  );
};

export default RemoveNode;
