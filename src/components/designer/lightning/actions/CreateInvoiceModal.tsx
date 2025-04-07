import React, { ReactNode, useCallback, useMemo } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from '@emotion/styled';
import {
  Button,
  Col,
  Form,
  InputNumber,
  message,
  Modal,
  Result,
  Row,
  Select,
} from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LitdNode } from 'shared/types';
import { LightningNodeChannelAsset } from 'lib/lightning/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { mapToTapd } from 'utils/network';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import { Loader } from 'components/common';
import AssetAmount from 'components/common/AssetAmount';
import CopyableInput from 'components/common/form/CopyableInput';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

const Styled = {
  AssetOption: styled.div`
    display: flex;
    justify-content: space-between;

    code {
      color: #888;
      font-size: 0.8em;
    }
  `,
};

interface FormValues {
  node: string;
  assetId: string;
  amount: number;
}

interface Props {
  network: Network;
}

const CreateInvoiceModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.CreateInvoiceModal',
  );
  const { visible, nodeName, invoice, amount, assetName } = useStoreState(
    s => s.modals.createInvoice,
  );
  const { nodes } = useStoreState(s => s.lightning);
  const { showCreateInvoice, hideCreateInvoice } = useStoreActions(s => s.modals);
  const { createInvoice, getChannels, getInfo } = useStoreActions(s => s.lightning);
  const { createAssetInvoice, getAssetsInChannels } = useStoreActions(s => s.lit);
  const { getAssetRoots, formatAssetAmount, toAssetUnits } = useStoreActions(s => s.tap);
  const { notify } = useStoreActions(s => s.app);

  const [form] = Form.useForm();
  const assetId = Form.useWatch<string>('assetId', form) || 'sats';
  const selectedNode = Form.useWatch<string>('node', form) || '';

  const isLitd = network.nodes.lightning.some(
    n => n.name === selectedNode && n.implementation === 'litd',
  );

  const getAssetsAsync = useAsync(async () => {
    if (!visible) return;
    const litNodes = network.nodes.lightning.filter(n => n.implementation === 'litd');
    for (const node of litNodes) {
      await getInfo(node);
      await getChannels(node);
      await getAssetRoots(mapToTapd(node));
    }
  }, [network.nodes, visible]);

  const assets = useMemo(() => {
    return getAssetsInChannels({ nodeName: selectedNode }).map(a => a.asset);
  }, [nodes, selectedNode]);

  const createAsync = useAsyncCallback(async (values: FormValues) => {
    try {
      const { lightning } = network.nodes;
      const node = lightning.find(n => n.name === values.node);
      if (!node || !values.amount) return;

      let invoice: string;
      let assetName = 'sats';
      if (assetId === 'sats') {
        const amount = parseInt(`${values.amount}`);
        invoice = await createInvoice({ node, amount, memo: '' });
      } else {
        const litdNode = node as LitdNode;
        const amount = toAssetUnits({ assetId, amount: values.amount });
        const res = await createAssetInvoice({ node: litdNode, assetId, amount });
        invoice = res.invoice;
        const asset = assets.find(a => a.id === assetId) as LightningNodeChannelAsset;
        assetName = `${asset.name} (${format(res.sats)} sats)`;
      }
      await showCreateInvoice({
        nodeName: node.name,
        amount: values.amount,
        invoice,
        assetName,
      });
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const suggestAmt = useCallback(
    (assetId: string) => {
      if (assetId === 'sats') return 1_000_000;

      const asset = assets.find(a => a.id === assetId) as LightningNodeChannelAsset;
      const amount = Math.floor(parseInt(asset.remoteBalance) / 2).toString();

      return formatAssetAmount({ assetId, amount });
    },
    [assets, isLitd],
  );

  const handleCopy = () => {
    message.success(l('copied'), 2);
    hideCreateInvoice();
  };

  let cmp: ReactNode;
  if (getAssetsAsync.loading) {
    cmp = <Loader />;
  } else if (!invoice) {
    cmp = (
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        colon={false}
        initialValues={{ node: nodeName, amount: 1_000_000, assetId: 'sats' }}
        onFinish={createAsync.execute}
      >
        <Row gutter={16}>
          <Col span={12}></Col>
          <Col span={12}></Col>
        </Row>
        <LightningNodeSelect
          network={network}
          name="node"
          label={l('nodeLabel')}
          disabled={createAsync.loading}
        />
        {isLitd && assets.length > 0 && (
          <Form.Item
            name="assetId"
            label={l('assetLabel')}
            rules={[{ required: true, message: l('cmps.forms.required') }]}
          >
            <Select
              disabled={createAsync.loading}
              onChange={value => form.setFieldsValue({ amount: suggestAmt(value) })}
            >
              <Select.Option value="sats">Bitcoin (sats)</Select.Option>
              <Select.OptGroup label="Taproot Assets">
                {assets.map(a => (
                  <Select.Option key={a.id} value={a.id}>
                    <Styled.AssetOption>
                      <span>
                        {a.name} <code>({ellipseInner(a.id, 4)})</code>
                      </span>
                      <code>
                        <AssetAmount assetId={a.id} amount={a.remoteBalance} />
                      </code>
                    </Styled.AssetOption>
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
          </Form.Item>
        )}
        <Form.Item
          name="amount"
          label={l('amountLabel')}
          rules={[{ required: true, message: l('cmps.forms.required') }]}
        >
          <InputNumber<number>
            min={1}
            disabled={createAsync.loading}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => parseFloat(`${v}`.replace(/(undefined|,*)/g, ''))}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    );
  } else {
    cmp = (
      <Result
        status="success"
        title={l('successTitle')}
        subTitle={l('successDesc', { nodeName, amount: format(`${amount}`), assetName })}
        extra={
          <Form>
            <Form.Item>
              <CopyableInput label="Invoice" value={invoice} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={invoice} onCopy={handleCopy}>
                <Button type="primary">{l('copyClose')}</Button>
              </CopyToClipboard>
            </Form.Item>
          </Form>
        }
      />
    );
  }

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideCreateInvoice()}
        destroyOnClose
        footer={invoice ? null : undefined}
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: createAsync.loading,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default CreateInvoiceModal;
