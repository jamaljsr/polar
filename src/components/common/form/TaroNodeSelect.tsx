import React, { useMemo, useState } from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { Network } from 'types';
import { format } from 'utils/units';
import { TaroNodeModel, TaroNodeMapping } from 'store/models/taro';
import { CommonNode } from 'shared/types';

export interface Props extends SelectProps<SelectValue> {
  name: string;
  label?: string;
  help?: string;
  nodeStatus?: Status;
  initialValue?: string;
  nodes?: TaroNodeMapping;
  networkNodes?: CommonNode[];
}

const TaroNodeSelect: React.FC<Props> = ({
  name,
  label,
  help,
  nodeStatus,
  initialValue,
  nodes,
  networkNodes,
  onChange,
  ...rest
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.TaroNodeSelect');
  const [selected, setSelected] = useState(initialValue || '');

  const handleChange = (value: SelectValue, option: any) => {
    setSelected(`${value}`);
    if (onChange) onChange(value, option);
  };

  if (nodeStatus !== undefined && networkNodes) {
    networkNodes = networkNodes.filter(n => n.status === nodeStatus);
  }

  return (
    <Form.Item
      name={name}
      label={label}
      help={help}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <Select {...rest} onChange={handleChange}>
        {networkNodes &&
          networkNodes.map(n => (
            <Select.Option key={n.name} value={n.name}>
              {n.name}
            </Select.Option>
          ))}
      </Select>
    </Form.Item>
  );
};

export default TaroNodeSelect;
