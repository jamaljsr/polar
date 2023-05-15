import React from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { Network } from 'types';

export interface Props extends SelectProps<SelectValue> {
  network: Network;
  name: string;
  label?: string;
  nodeStatus?: Status;
  initialValue?: string;
}

const TapNodeSelect: React.FC<Props> = ({
  network,
  name,
  label,
  nodeStatus,
  onChange,
  ...rest
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.TapNodeSelect');

  const handleChange = (value: SelectValue, option: any) => {
    if (onChange) onChange(value, option);
  };

  let tapNodes = network.nodes.tap;
  if (nodeStatus !== undefined) {
    tapNodes = tapNodes.filter(n => n.status === nodeStatus);
  }

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <Select {...rest} onChange={handleChange}>
        {tapNodes.map(node => (
          <Select.Option key={node.name} value={node.name}>
            {node.name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default TapNodeSelect;
