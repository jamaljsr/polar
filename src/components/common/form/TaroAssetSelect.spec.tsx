import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Form } from 'antd';
import { Status } from 'shared/types';
import { TaroAsset } from 'lib/taro/types';
import { defaultRepoState } from 'utils/constants';
import { createNetwork } from 'utils/network';
import { defaultTaroAsset, testManagedImages } from 'utils/tests';
import TaroAssetSelect from './TaroAssetSelect';

describe('TaroNodeSelect', () => {
  const renderComponent = () => {
    const network = createNetwork({
      id: 1,
      name: 'my-test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      status: Status.Started,
      repoState: defaultRepoState,
      managedImages: testManagedImages,
      customImages: [],
    });
    const taroassets: TaroAsset[] = [
      defaultTaroAsset({ name: 'testasset' }),
      defaultTaroAsset({ name: 'testasset2' }),
      defaultTaroAsset({ name: 'testasset3' }),
    ];
    const TestForm = () => {
      const [form] = Form.useForm();
      return (
        <Form name={'TaroSelect'} form={form} initialValues={{ assetIndex: 0 }}>
          <TaroAssetSelect
            name="assetIndex"
            label="Select Asset"
            items={taroassets as TaroAsset[]}
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
    //expect(getByText('Select Asset')).toBeInTheDocument();
    expect(getByLabelText('Select Asset')).toBeInTheDocument();
    expect(getByText('testasset')).toBeInTheDocument();
  });

  it('should display the selectable assets', () => {
    const { getByLabelText, getAllByText } = renderComponent();
    fireEvent.mouseDown(getByLabelText('Select Asset'));
    expect(getAllByText('testasset2')[0]).toBeInTheDocument();
    expect(getAllByText('testasset3')[0]).toBeInTheDocument();
  });
});
