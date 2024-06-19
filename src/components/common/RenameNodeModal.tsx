import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Form, Input, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { AnyNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';

interface Props {
  network: Network;
}

const RenameNodeModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.common.RenameNodeModal');

  const [form] = Form.useForm();
  const { visible, oldNodeName } = useStoreState(s => s.modals.renameNode);
  const { hideRenameNode } = useStoreActions(s => s.modals);
  const { renameNode } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);

  const updateAsync = useAsyncCallback(async (node: AnyNode, newName: string) => {
    try {
      const name = node.name;
      await renameNode({ node, newName });
      hideRenameNode();
      notify({ message: l('success', { name, newName }) });
    } catch (error: any) {
      notify({ message: l('error'), error });
    }
  });

  const { lightning, bitcoin, tap } = network.nodes;
  const nodes: AnyNode[] = [...lightning, ...bitcoin, ...tap];
  const node = nodes.find(n => n.name === oldNodeName);
  const handleSubmit = (values: any) => {
    if (!node) return;
    updateAsync.execute(node, values.newNodeName);
  };

  return (
    <Modal
      title={l('title', { name: oldNodeName })}
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
        initialValues={{ newNodeName: oldNodeName }}
        onFinish={handleSubmit}
      >
        {node?.status === Status.Started ? (
          <Alert type="warning" message={l('alert')} />
        ) : null}
        <Form.Item
          name="newNodeName"
          label={l('label')}
          rules={[
            { required: true, message: l('cmps.forms.required') },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: l('invalidName') },
          ]}
        >
          <Input placeholder="Enter node name" disabled={updateAsync.loading} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RenameNodeModal;
