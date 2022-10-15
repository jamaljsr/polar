import React, { ReactNode, useCallback, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import {
  AppleOutlined,
  DownloadOutlined,
  SettingOutlined,
  WindowsOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Form, Input, Modal, Result } from 'antd';
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
  CustomizeSection: styled.div<{ collapsed?: boolean }>`
    overflow: hidden;
    max-height: ${props => (props.collapsed ? '0' : '300px')};
    transition: max-height 0.5s;
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
  const [form] = Form.useForm();
  const [collapsed, setCollapsed] = useState(true);
  const {
    dockerVersions: { docker, compose },
    settings: { customDockerPaths },
  } = useStoreState(s => s.app);
  const { openInBrowser, getDockerVersions, notify, updateSettings } = useStoreActions(
    s => s.app,
  );
  const toggleCustomize = useCallback(() => setCollapsed(v => !v), []);
  const checkAsync = useAsyncCallback(async () => {
    try {
      const { dockerSocketPath, composeFilePath } = form.getFieldsValue();
      await updateSettings({
        customDockerPaths: {
          dockerSocketPath,
          composeFilePath,
        },
      });
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
      open={visible}
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

        <Styled.CustomizeSection collapsed={collapsed}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              dockerSocketPath: customDockerPaths.dockerSocketPath,
              composeFilePath: customDockerPaths.composeFilePath,
            }}
          >
            <Form.Item name="dockerSocketPath" label={l('dockerSocketPath')}>
              <Input
                placeholder={
                  platform === 'windows'
                    ? 'npipe:////./pipe/docker_engine'
                    : '/var/run/docker.sock'
                }
                allowClear
              />
            </Form.Item>
            <Form.Item name="composeFilePath" label={l('composeFilePath')}>
              <Input
                placeholder={
                  platform === 'windows'
                    ? 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker-compose'
                    : '/usr/local/bin/docker-compose'
                }
                allowClear
              />
            </Form.Item>
          </Form>
        </Styled.CustomizeSection>

        <Button type="link" block icon={<SettingOutlined />} onClick={toggleCustomize}>
          {l('customize')}
        </Button>
      </Styled.Details>
    </Modal>
  );
};

export default DetectDockerModal;
