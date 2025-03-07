import { SwapOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Col, Form, Modal, Row, Select } from 'antd';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import { usePrefixedTranslation } from 'hooks';
import React, { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { isVersionCompatible } from 'utils/strings';

const Styled = {
  IconCol: styled(Col)`
    display: flex;
    justify-content: center;
    align-items: center;
  `,
  Restart: styled.p`
    font-style: italic;
    opacity: 0.6;
  `,
};

interface Props {
  network: Network;
}

const ChangeBackendModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.ChangeBackendModal',
  );
  const [form] = Form.useForm();
  const [compatWarning, setCompatWarning] = useState<string>();
  const {
    visible,
    lnName: connectedNodeName,
    backendName,
  } = useStoreState(s => s.modals.changeBackend);
  const [selectedConnectedNode, setSelectedConnectedNode] = useState(connectedNodeName);
  const [selectedBackend, setSelectedBackend] = useState(backendName);
  const { dockerRepoState } = useStoreState(s => s.app);
  const { hideChangeBackend } = useStoreActions(s => s.modals);
  const { updateBackendNode } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);

  const changeAsync = useAsyncCallback(async (ln: string, backend: string) => {
    try {
      await updateBackendNode({
        id: network.id,
        lnName: ln,
        backendName: backend,
      });
      notify({
        message: l('successTitle'),
        description: l('successDesc', { ln, backend }),
      });
      hideChangeBackend();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  useEffect(() => {
    const { lightning, bitcoin } = network.nodes;
    const ln = lightning.find(n => n.name === selectedConnectedNode);
    const backend = bitcoin.find(n => n.name === selectedBackend);
    if (ln && backend) {
      const { compatibility } = dockerRepoState.images[ln.implementation];
      if (compatibility) {
        const requiredVersion = compatibility[ln.version];
        if (!isVersionCompatible(backend.version, requiredVersion)) {
          setCompatWarning(l('compatWarning', { ln, backend, requiredVersion }));
        } else {
          setCompatWarning(undefined);
        }
      }
    }
  }, [dockerRepoState, l, network.nodes, selectedConnectedNode, selectedBackend]);

  const handleSubmit = () => {
    const { lightning, bitcoin } = network.nodes;
    const { lnNode, backendNode } = form.getFieldsValue();
    const ln = lightning.find(n => n.name === lnNode);
    const backend = bitcoin.find(n => n.name === backendNode);
    if (!ln || !backend) return;
    changeAsync.execute(ln.name, backend.name);
  };

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideChangeBackend()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: changeAsync.loading,
          disabled: !!compatWarning,
        }}
        onOk={form.submit}
      >
        <p>{l('description')}</p>
        <Form
          form={form}
          layout="vertical"
          hideRequiredMark
          colon={false}
          initialValues={{ lnNode: connectedNodeName, backendNode: backendName }}
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={10}>
              <LightningNodeSelect
                network={network}
                name="lnNode"
                label={l('lnNodeLabel')}
                disabled={changeAsync.loading}
                onChange={v => setSelectedConnectedNode(v?.toString())}
              />
            </Col>
            <Styled.IconCol span={4}>
              <SwapOutlined style={{ fontSize: '2em', opacity: 0.5 }} />
            </Styled.IconCol>
            <Col span={10}>
              <Form.Item
                name="backendNode"
                label={l('backendNodeLabel')}
                rules={[{ required: true, message: l('cmps.forms.required') }]}
              >
                <Select
                  disabled={changeAsync.loading}
                  onChange={v => setSelectedBackend(v?.toString())}
                >
                  {network.nodes.bitcoin.map(node => (
                    <Select.Option key={node.name} value={node.name}>
                      {node.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {network.status === Status.Started && (
            <Styled.Restart>
              {l('restartNotice', { name: selectedConnectedNode })}
            </Styled.Restart>
          )}
          {compatWarning && (
            <Alert type="warning" message={compatWarning} closable={false} showIcon />
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ChangeBackendModal;
