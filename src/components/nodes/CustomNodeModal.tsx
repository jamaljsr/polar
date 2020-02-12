import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { useStoreActions } from 'store';
import { CustomNode } from 'types';
import { dockerConfigs } from 'utils/constants';
import DockerImageInput from 'components/common/form/DockerImageInput';
import { CommandVariables } from './';

interface Props {
  node: CustomNode;
  onClose: () => void;
}

const CustomNodeModal: React.FC<Props> = ({ node, onClose }) => {
  const { l } = usePrefixedTranslation('cmps.nodes.CustomNodeModal');
  const [form] = Form.useForm();
  const { notify, saveCustomNode } = useStoreActions(s => s.app);
  const [activeImpl, setActiveImpl] = useState(node.implementation);
  const isEditing = !!node.id;

  const saveAsync = useAsyncCallback(async (nodeToSave: CustomNode) => {
    try {
      await saveCustomNode(nodeToSave);
      onClose();
    } catch (error) {
      notify({ message: l('saveError'), error });
    }
  });
  const handleSubmit = (values: any) => {
    const { id } = node;
    const { implementation, dockerImage, command } = values;
    saveAsync.execute({ id, implementation, dockerImage, command });
  };
  const handleImplChange = (value: NodeImplementation) => {
    setActiveImpl(value);
    form.setFieldsValue({ command: dockerConfigs[value].command });
  };

  const implGroups: Record<string, NodeImplementation[]> = {
    Lightning: ['LND', 'c-lightning'],
    Bitcoin: ['bitcoind'],
  };

  return (
    <Modal
      title={l('title', node)}
      visible
      width={600}
      destroyOnClose
      maskClosable={false}
      onCancel={onClose}
      cancelText={l('cancelBtn')}
      onOk={form.submit}
      okText={l('okBtn')}
      okButtonProps={{
        loading: saveAsync.loading,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        hideRequiredMark
        colon={false}
        initialValues={node}
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="implementation" label={l('implementation')}>
              <Select
                onChange={v => handleImplChange(v as NodeImplementation)}
                disabled={isEditing || saveAsync.loading}
              >
                {Object.entries(implGroups).map(([label, impls]) => (
                  <Select.OptGroup label={label} key={label}>
                    {impls.map(impl => (
                      <Select.Option value={impl} key={impl}>
                        <img src={dockerConfigs[impl].logo} width={16} alt="logo" />{' '}
                        {dockerConfigs[impl].name}
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <DockerImageInput
              name="dockerImage"
              label={l('dockerImage')}
              disabled={isEditing || saveAsync.loading}
            />
          </Col>
        </Row>
        <Form.Item
          name="command"
          label={l('command')}
          rules={[{ required: true, message: l('cmps.forms.required') }]}
        >
          <Input.TextArea
            rows={6}
            className="custom-scroll"
            disabled={saveAsync.loading}
          />
        </Form.Item>
        <CommandVariables implementation={activeImpl} />
      </Form>
    </Modal>
  );
};

export default CustomNodeModal;
