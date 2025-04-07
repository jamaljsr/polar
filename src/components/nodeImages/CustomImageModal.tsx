import React, { useState } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { Alert, Col, Form, Input, Modal, Row, Select } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { NodeImplementation } from 'shared/types';
import { useStoreActions } from 'store';
import { CustomImage } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getPolarPlatform } from 'utils/system';
import DockerImageInput from 'components/common/form/DockerImageInput';
import { CommandVariables } from './';

interface Props {
  image: CustomImage;
  onClose: () => void;
}

const CustomImageModal: React.FC<Props> = ({ image, onClose }) => {
  const { l } = usePrefixedTranslation('cmps.nodeImages.CustomImageModal');
  const [form] = Form.useForm();
  const { notify, saveCustomImage, getDockerImages } = useStoreActions(s => s.app);
  const [activeImpl, setActiveImpl] = useState(image.implementation);
  const isEditing = !!image.id;

  // get an updated list of docker images in case it's changed since launching the app
  const fetchImagesAsync = useAsync(async () => {
    try {
      await getDockerImages();
    } catch (error: any) {
      notify({ message: l('loadImagesError'), error });
    }
  }, [image]);

  const saveAsync = useAsyncCallback(async (imageToSave: CustomImage) => {
    try {
      await saveCustomImage(imageToSave);
      onClose();
    } catch (error: any) {
      notify({ message: l('saveError'), error });
    }
  });
  const handleSubmit = (values: any) => {
    const { id } = image;
    const { implementation, dockerImage, name, command } = values;
    saveAsync.execute({ id, name, implementation, dockerImage, command });
  };
  const handleImplChange = (value: NodeImplementation) => {
    setActiveImpl(value);
    form.setFieldsValue({ command: dockerConfigs[value].command });
  };

  const platform = getPolarPlatform();
  const lnImpls: NodeImplementation[] = ['LND', 'c-lightning', 'eclair', 'litd'];
  const implGroups: Record<string, NodeImplementation[]> = {
    Lightning: lnImpls.filter(i => dockerConfigs[i].platforms.includes(platform)),
    Bitcoin: ['bitcoind'],
    'Taproot Assets': ['tapd'],
  };

  return (
    <Modal
      title={l('title', image)}
      open
      width={600}
      destroyOnClose
      maskClosable={false}
      onCancel={onClose}
      cancelText={l('cancelBtn')}
      onOk={form.submit}
      okText={l('okBtn')}
      okButtonProps={{
        loading: fetchImagesAsync.loading || saveAsync.loading,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        hideRequiredMark
        colon={false}
        initialValues={image}
        onFinish={handleSubmit}
      >
        {isEditing && <Alert type="info" showIcon message={l('editingInfo')} />}
        <Form.Item
          name="name"
          label={l('name')}
          rules={[{ required: true, message: l('cmps.forms.required') }]}
        >
          <Input placeholder={l('namePlaceholder')} />
        </Form.Item>
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

export default CustomImageModal;
