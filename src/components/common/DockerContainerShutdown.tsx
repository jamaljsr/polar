import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';
import { useStoreActions } from 'store';
import { useAsyncCallback } from 'react-async-hook';
import { Modal, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { usePrefixedTranslation } from 'hooks';
import styled from '@emotion/styled';

const Styled = {
  LoadingCard: styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  `,
  LoadingLabel: styled.div`
    margin-left: 10px;
  `,
  Loading: styled(LoadingOutlined)`
    font-size: 24px;
  `,
};

const DockerContainerShutdown: React.FC = () => {
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const { stopAll } = useStoreActions(s => s.network);
  const stopDockerContainersAsync = useAsyncCallback(stopAll);
  const { l } = usePrefixedTranslation('cmps.common.DockerContainerShutdown');
  useEffect(() => {
    ipcRenderer.on('app-closing', async () => {
      setIsShuttingDown(true);
      await stopDockerContainersAsync.execute();
    });
    return () => {
      ipcRenderer.removeAllListeners('app-closing');
    };
  }, []);

  return (
    <Modal open={isShuttingDown} closable={false} maskClosable={false} footer={null}>
      <Styled.LoadingCard>
        <Spin size="large" indicator={<Styled.Loading spin />} />
        <Styled.LoadingLabel>{l('shutdownMsg')}</Styled.LoadingLabel>
      </Styled.LoadingCard>
    </Modal>
  );
};

export default DockerContainerShutdown;
