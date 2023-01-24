import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Form } from 'antd';
import { getTaroNetwork } from 'utils/tests';
import TaroAssetSelect from './TaroAssetSelect';
import { defaultTaroAsset } from 'utils/tests';
import { TaroAsset } from 'lib/taro/types';

describe('TaroNodeSelect', () => {
  const renderComponent = () => {
    const network = getTaroNetwork(1, 'test network');
    const taroassets: TaroAsset[] = [
      defaultTaroAsset({ name: 'testasset' }),
      defaultTaroAsset({ name: 'testasset2', amount: '100' }),
      defaultTaroAsset({ name: 'testasset3', amount: '100', type: 'COLLECTIBLE' }),
    ];
    const TestForm = () => {
      const [form] = Form.useForm();
      return (
        <Form name={'TaroSelect'} form={form} initialValues={{ assetIndex: 0 }}>
          <TaroAssetSelect
            name="assetIndex"
            items={taroassets as TaroAsset[]}
            initialValue={0}
          />
        </Form>
      );
    };
    const result = render(<TestForm />);
    return {
      ...result,
      network,
    };
  };

  it('should display the label and input', () => {
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Select Asset')).toBeInTheDocument();
    expect(getByLabelText('Select Asset')).toBeInTheDocument();
    expect(getByText('testasset')).toBeInTheDocument();
  });

  it('should display the selected asset and balance', () => {
    const { getByText, getByLabelText, getAllByText } = renderComponent();
    fireEvent.mouseDown(getByLabelText('Select Asset'));
    fireEvent.click(getAllByText('testasset2')[0]);
    expect(getByText('Balance: 100')).toBeInTheDocument();
  });

  it('should display the selected collectible asset and collectible help', () => {
    const { getByText, getByLabelText, getAllByText } = renderComponent();
    fireEvent.mouseDown(getByLabelText('Select Asset'));
    fireEvent.click(getAllByText('testasset3')[0]);
    expect(getByText('Collectible')).toBeInTheDocument();
  });
});
