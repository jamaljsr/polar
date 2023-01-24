import React, { useState } from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import * as PTARO from 'lib/taro/types';

export interface Props extends SelectProps<SelectValue> {
  name: string;
  label?: string;
  items?: PTARO.TaroAsset[] | PTARO.TaroBalance[];
  initialValue?: number;
  help?: string;
}

const TaroAssetSelect: React.FC<Props> = ({
  name,
  label,
  onChange,
  items: assets,
  initialValue,
  help,
  ...rest
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.TaroAssetSelect');
  const [selected, setSelected] = useState(initialValue || 0);

  const handleChange = (value: SelectValue, option: any) => {
    setSelected(value?.valueOf() as number);
    if (onChange) onChange(value, option);
  };

  return (
    <Form.Item
      name={name}
      label={label}
      help={help}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <Select {...rest} onChange={handleChange}>
        {assets &&
          assets.map((asset, index) => (
            <Select.Option key={asset.id} value={index}>
              {asset.name}
            </Select.Option>
          ))}
      </Select>
    </Form.Item>
  );
};

export default TaroAssetSelect;
