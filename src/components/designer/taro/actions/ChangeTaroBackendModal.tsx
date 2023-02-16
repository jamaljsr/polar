import React, { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { SwapOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Col, Form, Modal, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import TaroNodeSelect from 'components/common/form/TaroNodeSelect';

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

const ChangeTaroBackendModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.ChangeTaroBackendModal',
  );
  const [form] = Form.useForm();
  const [compatWarning, setCompatWarning] = useState<string>();
  const { visible, lndName, taroName } = useStoreState(s => s.modals.changeTaroBackend);
  const [selectedTaro, setSelectedTaro] = useState(taroName);
  const [selectedLNDBackend, setSelectedLNDBackend] = useState(lndName);
  const { dockerRepoState } = useStoreState(s => s.app);
  const { hideChangeTaroBackend } = useStoreActions(s => s.modals);
  const { updateTaroBackendNode } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);

  const changeAsync = useAsyncCallback(async (taroName: string, LNDName: string) => {
    try {
      await updateTaroBackendNode({
        id: network.id,
        taroName,
        LNDName: LNDName,
      });
      notify({
        message: l('successTitle'),
        description: l('successDesc', { taroName, LNDName }),
      });
      hideChangeTaroBackend();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  useEffect(() => {
    const { lightning, taro } = network.nodes;
    const taroNode = taro.find(n => n.name === selectedTaro);
    const lndBackend = lightning.find(n => n.name === selectedLNDBackend);
    if (taroNode && lndBackend) {
      const { compatibility } = dockerRepoState.images[taroNode.implementation];
      if (compatibility) {
        const requiredVersion = compatibility[lndBackend.version];
        //version compatibility function breaks down
        if (!requiredVersion) {
          setCompatWarning(
            l('compatWarning', {
              taroNode,
              lndBackend,
              requiredVersion: '2022.12.28-master',
            }),
          );
        } else {
          setCompatWarning(undefined);
        }
      } else {
        setCompatWarning(undefined);
      }
    }
  }, [dockerRepoState, l, network.nodes, selectedTaro, selectedLNDBackend]);

  const handleSubmit = () => {
    const { lightning, taro } = network.nodes;
    const { taroName, LNDName } = form.getFieldsValue();
    const taroNode = taro.find(n => n.name === taroName);
    const LNDBackend = lightning.find(n => n.name === LNDName);
    if (!taroNode || !LNDBackend) return;
    changeAsync.execute(taroNode.name, LNDBackend.name);
  };

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideChangeTaroBackend()}
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
          initialValues={{ taroName: taroName, LNDName: lndName }}
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={10}>
              <TaroNodeSelect
                network={network}
                name="taroName"
                label={l('taroNodeLabel')}
                disabled={changeAsync.loading}
                onChange={v => setSelectedTaro(v?.toString())}
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
                implementation="LND"
                onChange={v => setSelectedLNDBackend(v?.toString())}
              />
            </Col>
          </Row>
          {network.status === Status.Started && (
            <Styled.Restart>{l('restartNotice', { name: selectedTaro })}</Styled.Restart>
          )}
          {compatWarning && (
            <Alert type="warning" message={compatWarning} closable={false} showIcon />
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ChangeTaroBackendModal;
