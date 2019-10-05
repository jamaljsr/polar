import React, { useState } from 'react';
import { WalletBalanceResponse } from '@radar/lnrpc';
import { Form, Select } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import { LndNodeModel } from 'store/models/lnd';
import { Network } from 'types';
import { format } from 'utils/units';

interface Props {
  network: Network;
  id: string;
  form: WrappedFormUtils<any>;
  label?: string;
  initialValue?: string;
  nodes?: {
    [key: string]: LndNodeModel;
  };
}

const LightningNodeSelect: React.FC<Props> = ({
  network,
  id,
  form,
  label,
  initialValue,
  nodes,
}) => {
  const [help, setHelp] = useState<string>();
  const getBalance = (name: string): string | undefined => {
    if (nodes && nodes[name] && nodes[name].walletBalance) {
      const balances = nodes[name].walletBalance as WalletBalanceResponse;
      return `Balance: ${format(balances.confirmedBalance)} sats`;
    }
  };
  if (initialValue && help !== getBalance(initialValue))
    setHelp(getBalance(initialValue));

  const { lightning } = network.nodes;
  return (
    <Form.Item label={label} help={help}>
      {form.getFieldDecorator(id, {
        initialValue: initialValue,
        rules: [{ required: true, message: 'required' }],
      })(
        <Select onChange={v => setHelp(getBalance(v.toString()))}>
          {lightning.map(node => (
            <Select.Option key={node.name} value={node.name}>
              {node.name}
            </Select.Option>
          ))}
        </Select>,
      )}
    </Form.Item>
  );
};

export default LightningNodeSelect;
