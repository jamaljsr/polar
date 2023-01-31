import React, { ReactNode, useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from '@emotion/styled';
import { Button, Form, Input, InputNumber, message, Modal, Result } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TarodNode, TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
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
  const { getNewAddress } = useStoreActions(s => s.taro);

  //component state
  const [selectedAmount, setSelectedAmount] = useState('10');
  const [selectedGenesisBootstrapInfo, setSelectedGenesisBootstrapInfo] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<PTARO.TaroBalance>();
  const [taroAddress, setTaroAddress] = useState('');

  //component local variables
  const [form] = Form.useForm();
  const thisTaroNode = network.nodes.taro.find(
    node => node.name === nodeName,
  ) as TarodNode;
  const otherTaroNodes: TaroNode[] = network.nodes.taro.filter(
    node => node.name !== nodeName,
  );

  //When polar is first opened, we need to populate the state with the lightning node data
  useEffect(() => syncChart(network), []);

  const handleSelectedBalance = (value: PTARO.TaroBalance) => {
    setSelectedBalance(value);
    setSelectedGenesisBootstrapInfo(value.genesisBootstrapInfo);
    form.setFieldsValue({
      genesisBootstrapInfo: value.genesisBootstrapInfo,
      amount: value.type == PTARO.TARO_ASSET_TYPE.COLLECTIBLE ? 1 : 10,
    });
  };

  //submit
  const newAddressAsync = useAsyncCallback(async (payload: NewAddressPayload) => {
    try {
      const res = await getNewAddress(payload);
      setTaroAddress(res.encoded);
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = (values: { genesisBootstrapInfo: string; amount: string }) => {
    if (selectedGenesisBootstrapInfo) {
      const payload: NewAddressPayload = {
        node: thisTaroNode,
        genesisBootstrapInfo: values.genesisBootstrapInfo,
        amount: values.amount,
      };
      newAddressAsync.execute(payload);
    }
  };

  const handleCopy = () => {
    message.success(l('copied', { address: ellipseInner(taroAddress, 10, 10) }), 2);
    hideNewAddress();
  };

  let cmp: ReactNode;
  if (!taroAddress) {
    cmp = (
      <>
        <Form
          form={form}
          layout="vertical"
          colon={false}
          initialValues={{
            amount: '10',
            node: '',
            genesisBootstrapInfo: '',
          }}
          onFinish={handleSubmit}
        >
          <Form.Item name="genesisBootstrapInfo" label={l('genesisBootstrapInfo')}>
            <Input.TextArea
              rows={5}
              placeholder={l('genesisBootstrapInfo')}
              onChange={e => setSelectedGenesisBootstrapInfo(e.target.value)}
            />
          </Form.Item>
          <Styled.Spacer />

          <Styled.TaroDataSelect
            name="node"
            label={l('selectBalance')}
            taroNetworkNodes={otherTaroNodes}
            selectBalances
            onChange={v => handleSelectedBalance(v?.valueOf() as PTARO.TaroBalance)}
          />
          <Styled.Spacer />
          <Form.Item label={l('amount')} name="amount">
            <InputNumber
              onChange={v => setSelectedAmount(v?.valueOf()?.toString() as string)}
              min={'1'}
              disabled={selectedBalance?.type === PTARO.TARO_ASSET_TYPE.COLLECTIBLE}
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
          assetName: selectedBalance?.name,
          amount: format(`${selectedAmount}`),
        })}
        extra={
          <Form>
            <Form.Item>
              <CopyableInput label="Invoice" value={taroAddress} />
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
        okButtonProps={{ disabled: selectedGenesisBootstrapInfo.length === 0 }}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default NewAddressModal;
