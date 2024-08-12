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
  Input,
  InputNumber,
  PageHeader,
  Row,
} from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { dockerConfigs } from 'utils/constants';
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

const NewNetwork: React.FC = () => {
  useEffect(() => info('Rendering NewNetwork component'), []);

  const { l } = usePrefixedTranslation('cmps.network.NewNetwork');
  const theme = useTheme();
  const { navigateTo, notify } = useStoreActions(s => s.app);
  const { addNetwork } = useStoreActions(s => s.network);
  const { settings } = useStoreState(s => s.app);
  const { custom: customNodes } = settings.nodeImages;

  const createAsync = useAsyncCallback(async (values: any) => {
    try {
      values.customNodes = values.customNodes || {};

      if (values.tapdNodes > values.lndNodes) {
        throw new Error(l('tapdCountError'));
      }

      await addNetwork(values);
    } catch (error: any) {
      notify({ message: l('createError'), error });
    }
  });

  const initialCustomValues = customNodes.reduce((result, node) => {
    result[node.id] = 0;
    return result;
  }, {} as Record<string, number>);

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
          requiredMark={false}
          initialValues={{
            lndNodes: settings.newNodeCounts.LND,
            clightningNodes: settings.newNodeCounts['c-lightning'],
            eclairNodes: settings.newNodeCounts.eclair,
            bitcoindNodes: settings.newNodeCounts.bitcoind,
            tapdNodes: settings.newNodeCounts.tapd,
            litdNodes: settings.newNodeCounts.litd,
            customNodes: initialCustomValues,
          }}
          onFinish={createAsync.execute}
        >
          <Form.Item
            name="name"
            label={l('nameLabel')}
            rules={[{ required: true, message: l('cmps.forms.required') }]}
          >
            <Input placeholder={l('namePhldr')} />
          </Form.Item>
          <Form.Item
            name="description"
            label={l('descriptionLabel')}
            rules={[{ max: 100, message: 'Maximum length is 100 characters' }]}
          >
            <Input placeholder={l('namePhlDescription')} />
          </Form.Item>
          {customNodes.length > 0 && (
            <>
              <Styled.Divider orientation="left">{l('customLabel')}</Styled.Divider>
              <Row>
                {customNodes.map(node => (
                  <Col span={6} key={node.id}>
                    <Form.Item
                      name={['customNodes', node.id]}
                      label={node.name}
                      rules={[{ required: true, message: l('cmps.forms.required') }]}
                    >
                      <InputNumber min={0} max={10} />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </>
          )}
          <Styled.Divider orientation="left">{l('managedLabel')}</Styled.Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="lndNodes"
                label={dockerConfigs.LND.name}
                rules={[{ required: true, message: l('cmps.forms.required') }]}
              >
                <InputNumber min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="clightningNodes"
                label={dockerConfigs['c-lightning'].name}
                extra={isWindows() ? l('clightningWindows') : ''}
                rules={[{ required: true, message: l('cmps.forms.required') }]}
              >
                <InputNumber min={0} max={10} disabled={isWindows()} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="eclairNodes"
                label={dockerConfigs.eclair.name}
                rules={[{ required: true, message: l('cmps.forms.required') }]}
              >
                <InputNumber min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="bitcoindNodes"
                label={dockerConfigs.bitcoind.name}
                rules={[{ required: true, message: l('cmps.forms.required') }]}
              >
                <InputNumber min={1} max={10} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="tapdNodes"
                label={dockerConfigs.tapd.name}
                rules={[{ required: true, message: l('cmps.forms.required') }]}
              >
                <InputNumber min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="litdNodes"
                label={dockerConfigs.litd.name}
                rules={[{ required: true, message: l('cmps.forms.required') }]}
              >
                <InputNumber min={0} max={10} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createAsync.loading}>
              {l('btnCreate')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default NewNetwork;
