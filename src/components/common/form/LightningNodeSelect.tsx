import React, { useMemo, useState } from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, Status } from 'shared/types';
import { LightningNodeBalances } from 'lib/lightning/types';
import { LightningNodeModel } from 'store/models/lightning';
import { Network } from 'types';
import { format } from 'utils/units';

export interface Props extends SelectProps<SelectValue> {
  network: Network;
  name: string;
  label?: string;
  nodeStatus?: Status;
  implementation?: LightningNode['implementation'][] | LightningNode['implementation'];
  initialValue?: string;
  nodes?: {
    [key: string]: LightningNodeModel;
  };
}

const LightningNodeSelect: React.FC<Props> = ({
  network,
  name,
  label,
  nodeStatus,
  implementation,
  initialValue,
  nodes,
  onChange,
  ...rest
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.LightningNodeSelect');
  const [help, setHelp] = useState<string>();
  const [selected, setSelected] = useState(initialValue || '');

  useMemo(() => {
    if (nodes && nodes[selected] && nodes[selected].walletBalance) {
      const balances = nodes[selected].walletBalance as LightningNodeBalances;
      setHelp(`${l('balance')}: ${format(balances.confirmed || '0')} sats`);
    } else {
      setHelp('');
    }
  }, [selected, nodes, l]);

  const handleChange = (value: SelectValue, option: any) => {
    setSelected(`${value}`);
    if (onChange) onChange(value, option);
  };

  let lnNodes = network.nodes.lightning;
  if (nodeStatus !== undefined) {
    lnNodes = lnNodes.filter(n => n.status === nodeStatus);
  }
  if (implementation) {
    if (Array.isArray(implementation)) {
      lnNodes = lnNodes.filter(n => implementation.includes(n.implementation));
    } else {
      lnNodes = lnNodes.filter(n => n.implementation === implementation);
    }
  }
  return (
    <Form.Item
      name={name}
      label={label}
      extra={help}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <Select {...rest} onChange={handleChange}>
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
