import React from 'react';
import { Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CommonNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import RenameNodeInput from './form/RenameNodeInput';
import { useAsyncCallback } from 'react-async-hook';
import { Network } from 'types';

interface Props {
  network: Network;
}

const RenameNodeModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.common.RenameNodeModal');

  const [form] = Form.useForm();
  const { visible, newNodeName, defaultName } = useStoreState(s => s.modals.renameNode);
  const { hideRenameNode } = useStoreActions(s => s.modals);
  const { renameNode } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);

  const updateAsync = useAsyncCallback(async (node: CommonNode, newName: string) => {
    try {
      await renameNode({ node, newName });
      hideRenameNode();
      notify({ message: l('success', { name: node.name }) });
    } catch (error: any) {
      notify({ message: l('error'), error });
    }
  });

  const handleSubmit = (values: any) => {
    const { lightning, bitcoin, tap } = network.nodes;
    const nodes: CommonNode[] = [...lightning, ...bitcoin, ...tap];
    const node = nodes.find(n => n.name === newNodeName);
    if (!node) return;
    updateAsync.execute(node, values.newName);
  };

  return (
    <Modal
      title={l('title')}
      open={visible}
      onCancel={() => hideRenameNode()}
      destroyOnClose
      cancelText={l('cancelBtn')}
      okText={l('okBtn')}
      okButtonProps={{
        loading: updateAsync.loading,
      }}
      onOk={form.submit}
    >
      <Form
        form={form}
        layout="vertical"
        hideRequiredMark
        colon={false}
        initialValues={{ newNodeName }}
        onFinish={handleSubmit}
      >
        <RenameNodeInput
          form={form}
          name="name"
          defaultName={defaultName}
          disabled={updateAsync.loading}
        />
      </Form>
    </Modal>
  );
};

export default RenameNodeModal;
