import React, { ReactNode, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import { DownOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import {
  Button,
  Dropdown,
  Form,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
} from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { NewAddressPayload } from 'store/models/tap';
import { Network } from 'types';
import { getTapdNodes } from 'utils/network';
import { formatDecimals } from 'utils/numbers';
import { ellipseInner } from 'utils/strings';
import CopyableInput from 'components/common/form/CopyableInput';
import TapDataSelect from 'components/common/form/TapDataSelect';

const Styled = {
  Spacer: styled.div`
    height: 12px;
  `,
  TapDataSelect: styled(TapDataSelect)`
    width: 100%;
  `,
  Dropdown: styled(Dropdown)`
    float: right;
  `,
  AssetOption: styled.div`
    display: flex;
    justify-content: space-between;

    code {
      color: #888;
      font-size: 0.8em;
    }
  `,
};

const getNode = (network: Network, nodeName?: string) => {
  const tapNodes = getTapdNodes(network);
  const node = tapNodes.find(node => node.name === nodeName);
  const otherNodes = tapNodes.filter(node => node.name !== nodeName);
  return { node, otherNodes };
};

interface Props {
  network: Network;
}

const NewAddressModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.NewAddressModal');

  const { notify } = useStoreActions(s => s.app);
  const { visible, nodeName } = useStoreState(s => s.modals.newAddress);
  const { hideNewAddress } = useStoreActions(s => s.modals);
  const { syncUniverse, getNewAddress } = useStoreActions(s => s.tap);
  const { nodes } = useStoreState(s => s.tap);

  const [successMsg, setSuccessMsg] = useState('');
  const [tapAddress, setTapAddress] = useState('');

  const [form] = Form.useForm();
  const selectedAssetId: string = Form.useWatch('assetId', form);

  const selectedAsset = useMemo(() => {
    for (const node of Object.values(nodes)) {
      const asset = node.assets?.find(a => a.id === selectedAssetId);
      if (asset) return asset;
    }
  }, [nodes, selectedAssetId]);

  const handleSync = useAsyncCallback(async e => {
    const { node, otherNodes } = getNode(network, nodeName);
    const from = otherNodes[e.key];
    const hostname = `${from.name}:${from.implementation === 'litd' ? '8443' : '10029'}`;

    try {
      if (!node) throw new Error(`${nodeName} is not a TAP node`);

      const numUpdated = await syncUniverse({ node, hostname });
      message.success(l('syncSuccess', { count: numUpdated, hostname: from.name }));
    } catch (error: any) {
      notify({ message: l('syncError', { hostname: from.name }), error });
    }
  });

  const newAddressAsync = useAsyncCallback(
    async (values: { assetId: string; amount: string }) => {
      try {
        const { node } = getNode(network, nodeName);
        if (!node) throw new Error(`${nodeName} is not a TAP node`);

        const asset = Object.values(nodes)
          .flatMap(n => n.assets)
          .find(a => a?.id === selectedAssetId);
        if (!asset) throw new Error('Invalid asset selected');

        const amount = (Number(values.amount) * 10 ** asset.decimals).toFixed(0);

        const payload: NewAddressPayload = {
          node,
          assetId: values.assetId,
          amount,
        };

        const res = await getNewAddress(payload);
        setTapAddress(res.encoded);
        setSuccessMsg(
          l('successDesc', {
            assetName: asset.name,
            amount: formatDecimals(Number(amount), asset.decimals),
          }),
        );
      } catch (error: any) {
        notify({ message: l('submitError'), error });
      }
    },
  );

  const handleCopy = () => {
    message.success(l('copied', { address: ellipseInner(tapAddress, 10, 10) }), 2);
    hideNewAddress();
  };

  const { otherNodes } = getNode(network, nodeName);
  const assetRoots = (nodeName && nodes[nodeName]?.assetRoots) || [];

  let cmp: ReactNode;
  if (!tapAddress) {
    cmp = (
      <>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          colon={false}
          initialValues={{
            assetId: '',
            amount: '100',
          }}
          onFinish={newAddressAsync.execute}
        >
          <Form.Item
            name="assetId"
            label={l('asset')}
            rules={[{ required: true, message: l('cmps.forms.required') }]}
            help={
              <Styled.Dropdown
                menu={{
                  items: otherNodes.map((n, i) => ({
                    key: i,
                    label: n.name,
                  })),
                  onClick: handleSync.execute,
                }}
              >
                <a>
                  Sync assets from node <DownOutlined />
                </a>
              </Styled.Dropdown>
            }
          >
            <Select disabled={handleSync.loading}>
              {assetRoots.map(a => (
                <Select.Option key={a.id} value={a.id}>
                  <Styled.AssetOption>
                    <span>{a.name}</span>
                    <code>{ellipseInner(a.id, 4)}</code>
                  </Styled.AssetOption>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={l('amount')}
            name="amount"
            rules={[{ required: true, message: l('cmps.forms.required') }]}
            help={
              selectedAsset ? l('amountInfo', { decimals: selectedAsset.decimals }) : ''
            }
          >
            <InputNumber<number> min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </>
    );
  } else {
    cmp = (
      <Result
        status="success"
        title={l('successTitle')}
        subTitle={successMsg}
        extra={
          <Form>
            <Form.Item>
              <CopyableInput label="Address" value={tapAddress} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={tapAddress} onCopy={handleCopy}>
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
        title={l('title', { name: nodeName })}
        open={visible}
        destroyOnClose
        footer={tapAddress ? null : undefined}
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        onCancel={() => hideNewAddress()}
        onOk={form.submit}
        okButtonProps={{
          loading: newAddressAsync.loading,
        }}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default NewAddressModal;
