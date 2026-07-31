import React, { useState } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Alert, Button, Form, Input, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LndNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import CopyIcon from './CopyIcon';
import Loader from './Loader';

const Styled = {
  SeedGrid: styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 16px 0;
  `,
  SeedWord: styled.div`
    font-family: monospace;
  `,
  CopyAll: styled.div`
    text-align: right;
  `,
};

interface Props {
  network: Network;
}

const UnlockNodeModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.common.UnlockNodeModal');

  const [form] = Form.useForm();
  const [mnemonic, setMnemonic] = useState<string[]>();
  const { visible, nodeName } = useStoreState(s => s.modals.unlockNode);
  const { hideUnlockNode } = useStoreActions(s => s.modals);
  const { initNode } = useStoreActions(s => s.network);
  const { getWalletState } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const node = network.nodes.lightning.find(n => n.name === nodeName) as
    | LndNode
    | undefined;

  // Status.Locked covers both a wallet that exists and needs a password (LOCKED)
  // and a fresh node whose wallet was never created (NON_EXISTING) - the two
  // need entirely different RPCs (UnlockWallet vs GenSeed+InitWallet)
  const walletStateAsync = useAsync(async () => {
    if (!visible || !node) return undefined;
    return await getWalletState(node);
  }, [visible, node]);
  const notInitialized = walletStateAsync.result === 'NON_EXISTING';

  const submitAsync = useAsyncCallback(async (node: LndNode, password: string) => {
    try {
      const words = await initNode({ node, password });
      setMnemonic(words);
      notify({ message: l('initSuccess', { name: node.name }) });
    } catch (error: any) {
      notify({ message: l('initError'), error });
    }
  });

  const handleSubmit = (values: any) => {
    if (!node || !notInitialized) return;
    submitAsync.execute(node, values.password);
  };

  const handleClose = () => {
    setMnemonic(undefined);
    hideUnlockNode();
  };

  return (
    <Modal
      title={l(mnemonic ? 'seedTitle' : notInitialized ? 'initTitle' : 'title', {
        name: nodeName,
      })}
      open={visible}
      onCancel={handleClose}
      destroyOnClose
      footer={
        mnemonic
          ? [
              <Button key="done" type="primary" onClick={handleClose}>
                {l('doneBtn')}
              </Button>,
            ]
          : undefined
      }
      cancelText={l('cancelBtn')}
      okText={l(notInitialized ? 'initOkBtn' : 'okBtn')}
      okButtonProps={{
        loading: submitAsync.loading,
        disabled: walletStateAsync.loading || !notInitialized,
      }}
      onOk={form.submit}
    >
      {walletStateAsync.loading ? (
        <Loader inline />
      ) : mnemonic ? (
        <>
          <Alert type="warning" showIcon message={l('seedWarning')} />
          <Styled.SeedGrid>
            {mnemonic.map((word, i) => (
              <Styled.SeedWord key={i}>
                {i + 1}. {word}
              </Styled.SeedWord>
            ))}
          </Styled.SeedGrid>
          <Styled.CopyAll>
            <CopyIcon
              label={l('seedLabel')}
              value={mnemonic.join(' ')}
              text={l('copyAll')}
            />
          </Styled.CopyAll>
        </>
      ) : notInitialized ? (
        <Form
          form={form}
          layout="vertical"
          hideRequiredMark
          colon={false}
          initialValues={{ password: 'polarpass' }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="password"
            label={l('label')}
            rules={[
              { required: true, message: l('cmps.forms.required') },
              { min: 8, message: l('passwordTooShort') },
            ]}
          >
            <Input.Password
              placeholder="Enter wallet password"
              disabled={submitAsync.loading}
            />
          </Form.Item>
        </Form>
      ) : (
        <Alert type="info" showIcon message={l('unlockNotAvailable')} />
      )}
    </Modal>
  );
};

export default UnlockNodeModal;
