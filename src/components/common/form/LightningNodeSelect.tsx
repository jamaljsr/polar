import React, { useState } from 'react';
import { Form, Select } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import { usePrefixedTranslation } from 'hooks';
import { LightningNodeBalances } from 'lib/lightning/types';
import { LndNodeModel } from 'store/models/lnd';
import { Network } from 'types';
import { format } from 'utils/units';

export interface Props {
  network: Network;
  id: string;
  form: WrappedFormUtils<any>;
  label?: string;
  disabled?: boolean;
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
  disabled,
  initialValue,
  nodes,
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.LightningNodeSelect');
  const [help, setHelp] = useState<string>();
  const [initialized, setInitialized] = useState(false);
  const getBalance = (name: string): string | undefined => {
    if (nodes && nodes[name] && nodes[name].walletBalance) {
      const balances = nodes[name].walletBalance as LightningNodeBalances;
      return `${l('balance')}: ${format(balances.confirmed)} sats`;
    }
  };
  if (initialValue && !initialized) {
    setHelp(getBalance(initialValue));
    setInitialized(true);
  }

  const { lightning } = network.nodes;
  return (
    <Form.Item label={label} help={help}>
      {form.getFieldDecorator(id, {
        initialValue: initialValue,
        rules: [{ required: true, message: l('cmps.forms.required') }],
      })(
        <Select disabled={disabled} onChange={v => setHelp(getBalance(v.toString()))}>
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
