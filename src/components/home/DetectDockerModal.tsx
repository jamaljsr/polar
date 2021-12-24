import React, { ReactNode } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { AppleOutlined, DownloadOutlined, WindowsOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Modal, Result } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { getPolarPlatform, PolarPlatform } from 'utils/system';
import { DetailsList } from 'components/common';

const Styled = {
  DownloadButtons: styled.p`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    margin-top: 30px;
  `,
  Details: styled.div`
    width: 70%;
    margin: auto;
  `,
};

export const dockerLinks: Record<PolarPlatform, Record<string, string>> = {
  mac: {
    'Docker Desktop': 'https://docs.docker.com/docker-for-mac/install/',
  },
  windows: {
    'Docker Desktop': 'https://docs.docker.com/docker-for-windows/install/',
  },
  linux: {
    Docker: 'https://docs.docker.com/install/#server',
    'Docker Compose': 'https://docs.docker.com/compose/install/',
  },
  unknown: {},
};

const buttonIcons: Record<PolarPlatform, ReactNode> = {
  mac: <AppleOutlined />,
  windows: <WindowsOutlined />,
  linux: <DownloadOutlined />,
  unknown: <DownloadOutlined />,
};

const DetectDockerModal: React.FC = () => {
  const platform = getPolarPlatform();
  const { l } = usePrefixedTranslation('cmps.home.DetectDockerModal');
  const {
    dockerVersions: { docker, compose },
  } = useStoreState(s => s.app);
  const { openInBrowser, getDockerVersions, notify } = useStoreActions(s => s.app);
  const checkAsync = useAsyncCallback(async () => {
    try {
      await getDockerVersions({ throwErr: true });
    } catch (error: any) {
      notify({ message: l('dockerError'), error });
    }
  });

  const visible = !docker || !compose;

  const details = [
    { label: 'Docker', value: docker || l('notFound') },
    { label: 'Docker Compose', value: compose || l('notFound') },
  ];

  return (
    <Modal
      visible={visible}
      closable={false}
      width={600}
      centered
      footer={
        <Button loading={checkAsync.loading} onClick={checkAsync.execute}>
          {l('checkAgain')}
        </Button>
      }
    >
      <Result
        status="warning"
        title={l('notDetected')}
        extra={
          <div>
            <p>{l('description')}</p>
            <Styled.DownloadButtons>
              {Object.entries(dockerLinks[platform]).map(([text, url]) => (
                <Button
                  key={text}
                  type="primary"
                  icon={buttonIcons[platform]}
                  onClick={() => openInBrowser(url)}
                >
                  {l('download')} {text}
                </Button>
              ))}
            </Styled.DownloadButtons>
          </div>
        }
      />
      <Styled.Details>
        <DetailsList title={l('versionsTitle')} details={details} />
      </Styled.Details>
    </Modal>
  );
};

export default DetectDockerModal;
