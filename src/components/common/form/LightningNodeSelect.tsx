import React, { useState } from 'react';
import { Form, Select } from 'antd';
import { FormInstance } from 'antd/lib/form/Form';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { LightningNodeBalances } from 'lib/lightning/types';
import { LightningNodeModel } from 'store/models/lightning';
import { Network } from 'types';
import { format } from 'utils/units';

export interface Props {
  network: Network;
  name: string;
  form: FormInstance;
  label?: string;
  disabled?: boolean;
  status?: Status;
  nodes?: {
    [key: string]: LightningNodeModel;
  };
}

const LightningNodeSelect: React.FC<Props> = ({
  network,
  name,
  form,
  label,
  disabled,
  status,
  nodes,
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.LightningNodeSelect');
  const [help, setHelp] = useState<string>();
  const [initialValue] = useState(form.getFieldValue(name));
  const [initialized, setInitialized] = useState(false);
  const getBalance = (nodeName: string): string | undefined => {
    if (nodes && nodes[nodeName] && nodes[nodeName].walletBalance) {
      const balances = nodes[nodeName].walletBalance as LightningNodeBalances;
      return `${l('balance')}: ${format(balances.confirmed)} sats`;
    }
  };
  if (initialValue && !initialized) {
    setHelp(getBalance(initialValue));
    setInitialized(true);
  }

  let lnNodes = network.nodes.lightning;
  if (status !== undefined) {
    lnNodes = lnNodes.filter(n => n.status === status);
  }
  return (
    <Form.Item
      name={name}
      label={label}
      help={help}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <Select disabled={disabled} onChange={v => setHelp(getBalance(v.toString()))}>
        {lnNodes.map(node => (
          <Select.Option key={node.name} value={node.name}>
            {node.name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default LightningNodeSelect;
