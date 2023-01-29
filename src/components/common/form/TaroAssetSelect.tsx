import React from 'react';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import * as PTARO from 'lib/taro/types';

export interface Props extends SelectProps<SelectValue> {
  name: string;
  label?: string;
  items?: PTARO.TaroAsset[] | PTARO.TaroBalance[];
  help?: string;
}

const TaroAssetSelect: React.FC<Props> = ({
  name,
  label,
  onChange,
  items: assets,
  help,
  ...rest
}) => {
  const handleChange = (value: SelectValue, option: any) => {
    if (onChange) onChange(value, option);
  };

  return (
    <Form.Item name={name} label={label} help={help}>
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
