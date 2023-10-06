import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Form, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CommonNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import DockerCommandInput from './form/DockerCommandInput';

interface Props {
  network: Network;
}

const AdvancedOptionsModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.common.AdvancedOptionsModal');

  const [form] = Form.useForm();
  const { visible, nodeName, command, defaultCommand } = useStoreState(
    s => s.modals.advancedOptions,
  );
  const { hideAdvancedOptions } = useStoreActions(s => s.modals);
  const { updateAdvancedOptions } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);

  const updateAsync = useAsyncCallback(async (node: CommonNode, command: string) => {
    try {
      await updateAdvancedOptions({ node, command });
      hideAdvancedOptions();
      notify({ message: l('success', { name: node.name }) });
    } catch (error: any) {
      notify({ message: l('error'), error });
    }
  });

  const handleSubmit = (values: any) => {
    const { lightning, bitcoin, tap } = network.nodes;
    const nodes: CommonNode[] = [...lightning, ...bitcoin, ...tap];
    const node = nodes.find(n => n.name === nodeName);
    if (!node) return;
    updateAsync.execute(node, values.command);
  };

  return (
    <Modal
      title={l('title')}
      open={visible}
      onCancel={() => hideAdvancedOptions()}
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
        initialValues={{ command }}
        onFinish={handleSubmit}
      >
        <DockerCommandInput
          form={form}
          name="command"
          defaultCommand={defaultCommand}
          disabled={updateAsync.loading}
        />
      </Form>
    </Modal>
  );
};

export default AdvancedOptionsModal;
