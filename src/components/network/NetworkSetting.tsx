import React, { useEffect } from 'react';
import { info } from 'electron-log';
import styled from '@emotion/styled';
import { Button, Card, Col, Divider, Form, InputNumber, PageHeader, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { BasePorts, dockerConfigs } from 'utils/constants';
import { isWindows } from 'utils/system';
import { HOME } from 'components/routing';

const Styled = {
  PageHeader: styled(PageHeader)<{ colors: ThemeColors['pageHeader'] }>`
    border: 1px solid ${props => props.colors.border};
    border-radius: 2px;
    background-color: ${props => props.colors.background};
    margin-bottom: 10px;
    flex: 0;
  `,
  Divider: styled(Divider)`
    .ant-divider-inner-text {
      font-size: 14px;
      opacity: 0.5;
    }
  `,
};

const NetworkSetting: React.FC = () => {
  useEffect(() => info('Rendering NetworkSetting component'), []);

  const { l } = usePrefixedTranslation('cmps.network.NetworkSetting');
  const theme = useTheme();
  const { navigateTo, updateSettings } = useStoreActions(s => s.app);
  const { settings } = useStoreState(s => s.app);

  const saveSettings = (e: any) => {
    updateSettings({
      basePorts: { ...e },
    });
  };

  return (
    <>
      <Styled.PageHeader
        title={l('title')}
        colors={theme.pageHeader}
        onBack={() => navigateTo(HOME)}
      />
      <Card>
        <Form
          layout="vertical"
          colon={false}
          initialValues={{
            LND: settings.basePorts.LND || BasePorts.LND,
            'c-lightning': settings.basePorts['c-lightning'] || BasePorts['c-lightning'],
            eclair: settings.basePorts.eclair || BasePorts.eclair,
            bitcoind: settings.basePorts.bitcoind || BasePorts.bitcoind,
          }}
          onFinish={saveSettings}
        >
          <Styled.Divider orientation="left">{l('basePorts')}</Styled.Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="LND" label={dockerConfigs.LND.name}>
                <InputNumber />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="c-lightning"
                label={dockerConfigs['c-lightning'].name}
                extra={isWindows() ? l('clightningWindows') : ''}
              >
                <InputNumber disabled={isWindows()} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="eclair" label={dockerConfigs.eclair.name}>
                <InputNumber />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="bitcoind" label={dockerConfigs.bitcoind.name}>
                <InputNumber />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={false}>
              {l('btnSave')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default NetworkSetting;
