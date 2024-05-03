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
import { TapNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { NewAddressPayload } from 'store/models/tap';
import { Network } from 'types';
import { getTapdNodes } from 'utils/network';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
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

  const [selectedAmount, setSelectedAmount] = useState(100);
  const [selectedName, setSelectedName] = useState('');
  const [tapAddress, setTapAddress] = useState('');

  const [form] = Form.useForm();

  const { node, otherNodes } = useMemo(() => {
    const tapNodes = getTapdNodes(network);
    const node = tapNodes.find(node => node.name === nodeName);
    const otherNodes = tapNodes.filter(node => node.name !== nodeName);
    if (!node) throw new Error(`${nodeName} is not a TAP node`);
    return { node, otherNodes };
  }, [network.nodes, nodeName]);

  const handleSync = useAsyncCallback(async e => {
    const from = otherNodes[e.key];
    const hostname = from.implementation === 'litd' ? `${from.name}:8443` : from.name;

    try {
      const numUpdated = await syncUniverse({ node: node as TapNode, hostname });
      message.success(l('syncSuccess', { count: numUpdated, hostname: from.name }));
    } catch (error: any) {
      notify({ message: l('syncError', { hostname: from.name }), error });
    }
  });

  const newAddressAsync = useAsyncCallback(async (payload: NewAddressPayload) => {
    try {
      const res = await getNewAddress(payload);
      setTapAddress(res.encoded);
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = (values: { assetId: string; amount: string }) => {
    const payload: NewAddressPayload = {
      node: node as TapNode,
      assetId: values.assetId,
      amount: values.amount,
    };
    newAddressAsync.execute(payload);
  };

  const handleCopy = () => {
    message.success(l('copied', { address: ellipseInner(tapAddress, 10, 10) }), 2);
    hideNewAddress();
  };

  const assetOptions = nodes[node.name]?.assetRoots || [];

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
          onFinish={handleSubmit}
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
            <Select
              disabled={handleSync.loading}
              onChange={(_, option: any) => setSelectedName(option.label)}
            >
              {assetOptions.map(a => (
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
          >
            <InputNumber<number>
              onChange={v => setSelectedAmount(v as number)}
              min={1}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
            />
          </Form.Item>
        </Form>
      </>
    );
  } else {
    cmp = (
      <Result
        status="success"
        title={l('successTitle')}
        subTitle={l('successDesc', {
          assetName: selectedName,
          amount: format(`${selectedAmount}`),
        })}
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
