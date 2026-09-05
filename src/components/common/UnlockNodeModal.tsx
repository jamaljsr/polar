import React, { useState } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Alert, Button, Form, Input, Modal, Radio } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LndNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import CopyIcon from './CopyIcon';
import Loader from './Loader';
import RestoreWalletForm, { splitSeedWords } from './RestoreWalletForm';

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
  ModeSwitch: styled.div`
    margin-bottom: 16px;
  `,
};

type InitMode = 'create' | 'restore';

interface Props {
  network: Network;
}

const UnlockNodeModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.common.UnlockNodeModal');

  const [form] = Form.useForm();
  const [mnemonic, setMnemonic] = useState<string[]>();
  const [mode, setMode] = useState<InitMode>('create');
  const [backupFilePath, setBackupFilePath] = useState<string>();
  const { visible, nodeName } = useStoreState(s => s.modals.unlockNode);
  const { hideUnlockNode } = useStoreActions(s => s.modals);
  const { initNode, unlockNode, restoreNode } = useStoreActions(s => s.network);
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
  // restoring an existing seed is only possible when no wallet exists yet,
  // since InitWallet is rejected by LND for any other wallet state
  const restoring = notInitialized && mode === 'restore';

  const submitAsync = useAsyncCallback(async (node: LndNode, values: any) => {
    try {
      if (restoring) {
        await restoreNode({
          node,
          password: values.password,
          mnemonic: splitSeedWords(values.mnemonic),
          backupFilePath,
        });
        hideUnlockNode();
        // a channel backup does not reopen channels, it force-closes them to
        // recover the funds on-chain. the message must set that expectation
        const successKey = backupFilePath ? 'restoreSuccessWithBackup' : 'restoreSuccess';
        notify({ message: l(successKey, { name: node.name }) });
      } else if (notInitialized) {
        const words = await initNode({ node, password: values.password });
        setMnemonic(words);
        notify({ message: l('initSuccess', { name: node.name }) });
      } else {
        await unlockNode({ node, password: values.password });
        hideUnlockNode();
        notify({ message: l('success', { name: node.name }) });
      }
    } catch (error: any) {
      const errorKey = restoring
        ? 'restoreError'
        : notInitialized
        ? 'initError'
        : 'error';
      notify({ message: l(errorKey), error });
    }
  });

  const handleSubmit = (values: any) => {
    if (!node) return;
    submitAsync.execute(node, values);
  };

  const handleClose = () => {
    setMnemonic(undefined);
    setMode('create');
    setBackupFilePath(undefined);
    hideUnlockNode();
  };

  let titleKey = 'title';
  if (mnemonic) titleKey = 'seedTitle';
  else if (restoring) titleKey = 'restoreTitle';
  else if (notInitialized) titleKey = 'initTitle';

  let okKey = 'okBtn';
  if (restoring) okKey = 'restoreOkBtn';
  else if (notInitialized) okKey = 'initOkBtn';

  return (
    <Modal
      title={l(titleKey, { name: nodeName })}
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
      okText={l(okKey)}
      okButtonProps={{
        loading: submitAsync.loading,
        disabled: walletStateAsync.loading,
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
      ) : (
        <Form
          form={form}
          layout="vertical"
          hideRequiredMark
          colon={false}
          initialValues={{ password: 'polarpass' }}
          onFinish={handleSubmit}
        >
          {notInitialized && (
            <Styled.ModeSwitch>
              <Radio.Group
                value={mode}
                onChange={e => setMode(e.target.value)}
                disabled={submitAsync.loading}
              >
                <Radio.Button value="create">{l('modeCreate')}</Radio.Button>
                <Radio.Button value="restore">{l('modeRestore')}</Radio.Button>
              </Radio.Group>
            </Styled.ModeSwitch>
          )}
          <Form.Item
            name="password"
            label={l('label')}
            rules={[
              { required: true, message: l('cmps.forms.required') },
              ...(notInitialized ? [{ min: 8, message: l('passwordTooShort') }] : []),
            ]}
          >
            <Input.Password
              placeholder="Enter wallet password"
              disabled={submitAsync.loading}
            />
          </Form.Item>
          {restoring && (
            <RestoreWalletForm
              disabled={submitAsync.loading}
              backupFilePath={backupFilePath}
              onBackupChange={setBackupFilePath}
            />
          )}
        </Form>
      )}
    </Modal>
  );
};

export default UnlockNodeModal;
