import React, { useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { info } from 'electron-log';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  PageHeader,
  Row,
  Typography,
} from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { dockerConfigs } from 'utils/constants';
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
  const { navigateTo, updateSettings, notify } = useStoreActions(s => s.app);
  const { settings } = useStoreState(s => s.app);

  const saveSettingsAsync = useAsyncCallback(async (values: any) => {
    try {
      const updatedPorts = {
        LND: {
          rest: values.LND,
          grpc: values.grpcLND,
        },
        'c-lightning': {
          rest: values['c-lightning'],
          grpc: values['grpcC-lightning'],
        },
        eclair: {
          rest: values.eclair,
        },
        bitcoind: {
          rest: values.bitcoind,
        },
        'bitcoind-knots': {
          rest: values['bitcoind-knots'],
        },
        tapd: {
          rest: values.tapd,
          grpc: values.grpcTapd,
        },
      };

      await updateSettings({ basePorts: { ...updatedPorts } });

      notify({ message: l('saveSuccess') });
    } catch (error: any) {
      notify({ message: l('saveError'), error });
    }
  });

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
            LND: settings.basePorts.LND.rest,
            'c-lightning': settings.basePorts['c-lightning'].rest,
            eclair: settings.basePorts.eclair.rest,
            bitcoind: settings.basePorts.bitcoind.rest,
            tapd: settings.basePorts.tapd.rest,
            grpcLND: settings.basePorts.LND.grpc,
            'grpcC-lightning': settings.basePorts['c-lightning'].grpc,
            grpcTapd: settings.basePorts.tapd.grpc,
          }}
          onFinish={saveSettingsAsync.execute}
        >
          <Typography>{l('description')}</Typography>
          <Styled.Divider orientation="left">{l('restPorts')}</Styled.Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="LND" label={dockerConfigs.LND.name}>
                <InputNumber />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="c-lightning" label={dockerConfigs['c-lightning'].name}>
                <InputNumber />
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
            <Col span={6}>
              <Form.Item name="tapd" label={dockerConfigs.tapd.name}>
                <InputNumber />
              </Form.Item>
            </Col>
          </Row>
          <Styled.Divider orientation="left">{l('grpcPorts')}</Styled.Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="grpcLND" label={dockerConfigs.LND.name}>
                <InputNumber />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="grpcC-lightning" label={dockerConfigs['c-lightning'].name}>
                <InputNumber />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="grpcTapd" label={dockerConfigs.tapd.name}>
                <InputNumber />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saveSettingsAsync.loading}>
              {l('btnSave')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default NetworkSetting;
