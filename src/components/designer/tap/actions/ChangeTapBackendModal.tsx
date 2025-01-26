import React, { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { SwapOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Col, Form, Modal, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { isVersionCompatible } from 'utils/strings';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import TapNodeSelect from 'components/common/form/TapNodeSelect';

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

const ChangeTapBackendModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.ChangeTapBackendModal',
  );
  const [form] = Form.useForm();
  const [compatWarning, setCompatWarning] = useState<string>();
  const { visible, lndName, tapName } = useStoreState(s => s.modals.changeTapBackend);
  const [selectedTap, setSelectedTap] = useState(tapName);
  const [selectedLNDBackend, setSelectedLNDBackend] = useState(lndName);
  const { dockerRepoState } = useStoreState(s => s.app);
  const { hideChangeTapBackend } = useStoreActions(s => s.modals);
  const { updateTapBackendNode } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);

  const changeAsync = useAsyncCallback(async (tapName: string, LNDName: string) => {
    try {
      await updateTapBackendNode({
        id: network.id,
        tapName,
        lndName: LNDName,
      });
      notify({
        message: l('successTitle'),
        description: l('successDesc', { tapName, LNDName }),
      });
      hideChangeTapBackend();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  useEffect(() => {
    const { lightning, tap } = network.nodes;
    const tapNode = tap.find(n => n.name === selectedTap);
    const lndBackend = lightning.find(n => n.name === selectedLNDBackend);
    if (tapNode && lndBackend) {
      const { compatibility } = dockerRepoState.images[tapNode.implementation];
      if (compatibility) {
        const requiredVersion = compatibility[tapNode.version];
        const isLowerVersion =
          isVersionCompatible(lndBackend.version, requiredVersion) &&
          lndBackend.version !== requiredVersion;
        if (isLowerVersion) {
          setCompatWarning(
            l('compatWarning', {
              tapNode,
              lndBackend,
              requiredVersion: compatibility[tapNode.version],
            }),
          );
        } else {
          setCompatWarning(undefined);
        }
      }
    }
  }, [dockerRepoState, l, network.nodes, selectedTap, selectedLNDBackend]);

  const handleSubmit = () => {
    const { lightning, tap } = network.nodes;
    const { tapName, LNDName } = form.getFieldsValue();
    const tapNode = tap.find(n => n.name === tapName);
    const LNDBackend = lightning.find(n => n.name === LNDName);
    if (!tapNode || !LNDBackend) return;
    changeAsync.execute(tapNode.name, LNDBackend.name);
  };

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideChangeTapBackend()}
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
          initialValues={{ tapName: tapName, LNDName: lndName }}
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={10}>
              <TapNodeSelect
                network={network}
                name="tapName"
                label={l('tapNodeLabel')}
                disabled={changeAsync.loading}
                onChange={v => setSelectedTap(v?.toString())}
              />
            </Col>
            <Styled.IconCol span={4}>
              <SwapOutlined style={{ fontSize: '2em', opacity: 0.5 }} />
            </Styled.IconCol>
            <Col span={10}>
              <LightningNodeSelect
                network={network}
                name="LNDName"
                label={l('LNDNodeLabel')}
                disabled={changeAsync.loading}
                implementations={['LND']}
                onChange={v => setSelectedLNDBackend(v?.toString())}
              />
            </Col>
          </Row>
          {compatWarning && (
            <Alert type="warning" message={compatWarning} closable={false} showIcon />
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ChangeTapBackendModal;
