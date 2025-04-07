import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Form, Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import { TapBalance } from 'lib/tap/types';
import { TapNodeModel } from 'store/models/tap';
import { Network } from 'types';
import { ellipseInner } from 'utils/strings';
import AssetAmount from '../AssetAmount';

const Styled = {
  AssetOption: styled.div`
    display: flex;
    justify-content: space-between;

    code {
      color: #888;
      font-size: 0.8em;
    }
  `,
};

export interface Props extends SelectProps<SelectValue> {
  name: string;
  label?: string;
  network: Network;
  nodeName: string;
  initialValue?: string;
  tapNodesState?: {
    [key: string]: TapNodeModel;
  };
}

const TapAssetSelect: React.FC<Props> = ({
  name,
  label,
  nodeName,
  initialValue,
  tapNodesState,
  onChange,
  ...rest
}) => {
  const { l } = usePrefixedTranslation('cmps.common.form.TapAssetSelect');
  const [selected, setSelected] = useState(initialValue || '');

  const { assets } = useMemo(() => {
    let assets: TapBalance[] = [];
    const balances = tapNodesState?.[nodeName]?.balances;
    if (balances) {
      assets = balances.sort((a, b) => a.name.localeCompare(b.name));
    }
    return { assets };
  }, [selected, tapNodesState, l, nodeName]);

  const handleChange = (value: SelectValue, option: any) => {
    setSelected(`${value}`);
    onChange?.(value, option);
  };

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: true, message: l('cmps.forms.required') }]}
    >
      <Select {...rest} onChange={handleChange}>
        <Select.Option value="sats">Bitcoin (sats)</Select.Option>
        {assets.length > 0 && (
          <Select.OptGroup label="Taproot Assets">
            {assets.map(a => (
              <Select.Option key={a.id} value={a.id}>
                <Styled.AssetOption>
                  <span>
                    {a.name} <code>({ellipseInner(a.id, 4)})</code>
                  </span>
                  <code>
                    <AssetAmount assetId={a.id} amount={a.balance} />
                  </code>
                </Styled.AssetOption>
              </Select.Option>
            ))}
          </Select.OptGroup>
        )}
      </Select>
    </Form.Item>
  );
};

export default TapAssetSelect;
