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
  Retry: styled.div`
    text-align: center;
    margin-top: 16px;
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

  const walletStateAsync = useAsync(async () => {
    if (!visible || !node || mnemonic) return undefined;
    return await getWalletState(node);
  }, [visible, node, mnemonic]);
  const notInitialized = walletStateAsync.result === 'NON_EXISTING';
  // a rejected GetState leaves result undefined, which is indistinguishable from
  // a LOCKED wallet
  const walletStateError = walletStateAsync.error;
  const restoring = notInitialized && mode === 'restore';

  const submitAsync = useAsyncCallback(
    async (
      node: LndNode,
      password: string,
      initializing: boolean,
      seedWords?: string[],
    ) => {
      try {
        if (restoring) {
          await restoreNode({
            node,
            password,
            mnemonic: seedWords || [],
            backupFilePath,
          });
          hideUnlockNode();
          const successKey = backupFilePath
            ? 'restoreSuccessWithBackup'
            : 'restoreSuccess';
          notify({ message: l(successKey, { name: node.name }) });
        } else if (initializing) {
          const words = await initNode({ node, password });
          setMnemonic(words);
          notify({ message: l('initSuccess', { name: node.name }) });
        } else {
          await unlockNode({ node, password });
          hideUnlockNode();
          notify({ message: l('success', { name: node.name }) });
        }
      } catch (error: any) {
        const errorKey = restoring
          ? 'restoreError'
          : initializing
          ? 'initError'
          : 'error';
        notify({ message: l(errorKey), error });
      }
    },
  );

  const handleSubmit = (values: any) => {
    if (!node) return;
    submitAsync.execute(
      node,
      values.password,
      notInitialized,
      values.mnemonic ? splitSeedWords(values.mnemonic) : undefined,
    );
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
        disabled: walletStateAsync.loading || !!walletStateError,
      }}
      onOk={form.submit}
    >
      {mnemonic ? (
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
      ) : walletStateAsync.loading ? (
        <Loader inline />
      ) : walletStateError ? (
        <>
          <Alert
            type="error"
            showIcon
            message={l('stateError')}
            description={walletStateError.message}
          />
          <Styled.Retry>
            <Button onClick={() => walletStateAsync.execute()}>{l('retryBtn')}</Button>
          </Styled.Retry>
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
