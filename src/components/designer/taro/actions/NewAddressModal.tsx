import React, { ReactNode, useEffect, useMemo, useState } from 'react';
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
import { TarodNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { NewAddressPayload } from 'store/models/taro';
import { Network } from 'types';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import CopyableInput from 'components/common/form/CopyableInput';
import TaroDataSelect from 'components/common/form/TaroDataSelect';

const Styled = {
  Spacer: styled.div`
    height: 12px;
  `,
  TaroDataSelect: styled(TaroDataSelect)`
    width: 100%;
  `,
  Dropdown: styled(Dropdown)`
    float: right;
  `,
};

interface Props {
  network: Network;
}

const NewAddressModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.NewAddressModal');

  //app
  const { notify } = useStoreActions(s => s.app);

  //designer actions
  const { syncChart } = useStoreActions(s => s.designer);

  //modal state
  const { visible, nodeName } = useStoreState(s => s.modals.newAddress);
  const { hideNewAddress } = useStoreActions(s => s.modals);

  //taro model
  const { syncUniverse, getNewAddress } = useStoreActions(s => s.taro);
  const { nodes } = useStoreState(s => s.taro);

  //component state
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [selectedName, setSelectedName] = useState('');
  const [taroAddress, setTaroAddress] = useState('');

  //component local variables
  const [form] = Form.useForm();
  const thisTaroNode = network.nodes.taro.find(
    node => node.name === nodeName,
  ) as TarodNode;
  const otherTaroNodes = network.nodes.taro.filter(node => node.name !== nodeName);

  //When polar is first opened, we need to populate the state with the lightning node data
  useEffect(() => syncChart(network), []);

  const handleSync = useAsyncCallback(async e => {
    const node = otherTaroNodes.find(n => n.name === e.key);
    if (!node) return;

    try {
      const numUpdated = await syncUniverse({ node: thisTaroNode, hostname: e.key });
      message.success(l('syncSuccess', { count: numUpdated, hostname: e.key }));
    } catch (error: any) {
      notify({ message: l('syncError', { hostname: e.key }), error });
    }
  });

  //submit
  const newAddressAsync = useAsyncCallback(async (payload: NewAddressPayload) => {
    try {
      const res = await getNewAddress(payload);
      setTaroAddress(res.encoded);
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = (values: { assetId: string; amount: string }) => {
    const payload: NewAddressPayload = {
      node: thisTaroNode,
      assetId: values.assetId,
      amount: values.amount,
    };
    newAddressAsync.execute(payload);
  };

  const handleCopy = () => {
    message.success(l('copied', { address: ellipseInner(taroAddress, 10, 10) }), 2);
    hideNewAddress();
  };

  const assetOptions = useMemo(() => {
    const node = nodes[thisTaroNode.name];
    if (node && node.assetRoots) {
      return node.assetRoots.map(asset => ({
        label: asset.name,
        value: asset.id,
      }));
    }
    return [];
  }, [nodes, thisTaroNode.name]);

  let cmp: ReactNode;
  if (!taroAddress) {
    cmp = (
      <>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          colon={false}
          initialValues={{
            assetId: '',
            amount: '10',
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
                  items: otherTaroNodes.map(n => ({
                    key: n.name,
                    label: n.name,
                  })),
                  onClick: handleSync.execute,
                }}
              >
                <a onClick={e => e.preventDefault()}>
                  Sync assets from node <DownOutlined />
                </a>
              </Styled.Dropdown>
            }
          >
            <Select
              options={assetOptions}
              disabled={handleSync.loading}
              onChange={(_, option: any) => setSelectedName(option.label)}
            />
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
              <CopyableInput label="Address" value={taroAddress} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={taroAddress} onCopy={handleCopy}>
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
        footer={taroAddress ? null : undefined}
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
