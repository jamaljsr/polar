import React, { useMemo } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Form, Input, Modal, Select } from 'antd';
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
  invoice: string;
}

interface Props {
  network: Network;
}

const PayInvoiceModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.actions.PayInvoiceModal');
  const { visible, nodeName } = useStoreState(s => s.modals.payInvoice);
  const { nodes } = useStoreState(s => s.lightning);
  const { hidePayInvoice } = useStoreActions(s => s.modals);
  const { payInvoice, getChannels, getInfo } = useStoreActions(s => s.lightning);
  const { payAssetInvoice, getAssetsInChannels } = useStoreActions(s => s.lit);
  const { getAssetRoots, formatAssetAmount } = useStoreActions(s => s.tap);
  const { notify } = useStoreActions(s => s.app);

  const [form] = Form.useForm();
  const assetId = Form.useWatch<string>('assetId', form) || 'sats';
  const selectedName = Form.useWatch<string>('node', form) || '';

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
    return getAssetsInChannels({ nodeName: selectedName }).map(a => a.asset);
  }, [nodes, selectedName]);

  const payAsync = useAsyncCallback(async (values: FormValues) => {
    try {
      const { lightning } = network.nodes;
      const node = lightning.find(n => n.name === values.node);
      if (!node || !values.invoice) return;

      const invoice = values.invoice;
      let amount = '0';
      let assetName = 'sats';
      if (assetId === 'sats') {
        const res = await payInvoice({ node, invoice });
        amount = format(res.amount);
      } else {
        const litdNode = node as LitdNode;
        const res = await payAssetInvoice({ node: litdNode, assetId, invoice });
        amount = formatAssetAmount({ assetId, amount: res.amount });
        const asset = assets.find(a => a.id === assetId) as LightningNodeChannelAsset;
        assetName = asset.name;
      }
      const nodeName = node.name;
      notify({
        message: l('successTitle'),
        description: l('successDesc', { amount: format(amount), nodeName, assetName }),
      });
      await hidePayInvoice();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  return (
    <Modal
      title={l('title')}
      open={visible}
      onCancel={() => hidePayInvoice()}
      destroyOnClose
      cancelText={l('cancelBtn')}
      okText={l('okBtn')}
      okButtonProps={{
        loading: payAsync.loading,
      }}
      onOk={form.submit}
    >
      {getAssetsAsync.loading ? (
        <Loader />
      ) : (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          colon={false}
          initialValues={{ node: nodeName, assetId: 'sats' }}
          onFinish={payAsync.execute}
          disabled={payAsync.loading}
        >
          <LightningNodeSelect
            network={network}
            name="node"
            label={l('nodeLabel')}
            disabled={payAsync.loading}
          />
          {assets.length > 0 && (
            <Form.Item
              name="assetId"
              label={l('assetLabel')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <Select>
                <Select.Option value="sats">Bitcoin (sats)</Select.Option>
                <Select.OptGroup label="Taproot Assets">
                  {assets.map(a => (
                    <Select.Option key={a.id} value={a.id}>
                      <Styled.AssetOption>
                        <span>
                          {a.name} <code>({ellipseInner(a.id, 4)})</code>
                        </span>
                        <code>
                          <AssetAmount assetId={a.id} amount={a.localBalance} />
                        </code>
                      </Styled.AssetOption>
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="invoice"
            label={l('invoiceLabel')}
            rules={[{ required: true, message: l('cmps.forms.required') }]}
          >
            <Input.TextArea rows={6} disabled={payAsync.loading} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default PayInvoiceModal;
