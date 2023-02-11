import React, { useState } from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { LightningNodeModel } from 'store/models/lightning';
import { Network } from 'types';

export interface Props extends SelectProps<SelectValue> {
  network: Network;
  name: string;
  label?: string;
  nodeStatus?: Status;
  initialValue?: string;
  nodes?: {
    [key: string]: LightningNodeModel;
  };
}

const TaroNodeSelect: React.FC<Props> = ({
  network,
  name,
  label,
  nodeStatus,
  initialValue,
  nodes,
  onChange,
  ...rest
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.LightningNodeSelect');
  const [selected, setSelected] = useState(initialValue || '');

  const handleChange = (value: SelectValue, option: any) => {
    setSelected(`${value}`);
    if (onChange) onChange(value, option);
  };

  let taroNodes = network.nodes.taro;
  if (nodeStatus !== undefined) {
    taroNodes = taroNodes.filter(n => n.status === nodeStatus);
  }

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <Select {...rest} onChange={handleChange}>
        {taroNodes.map(node => (
          <Select.Option key={node.name} value={node.name}>
            {node.name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default TaroNodeSelect;
