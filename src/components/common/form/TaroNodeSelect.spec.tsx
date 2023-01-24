import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Form } from 'antd';
import { getTaroNetwork } from 'utils/tests';
import TaroNodeSelect from './TaroNodeSelect';
import { Status } from 'shared/types';
import { createTarodNetworkNode } from 'utils/network';
describe('TaroNodeSelect', () => {
  const renderComponent = () => {
    const network = getTaroNetwork(1, 'test network');
    const bobTaro = createTarodNetworkNode(
      network,
      network.nodes.taro[0].version,
      network.nodes.taro[0].docker,
      Status.Started,
    );

    network.nodes.taro.push(bobTaro);

    const TestForm = () => {
      const [form] = Form.useForm();
      return (
        <Form
          name={'TaroNodeSelect'}
          form={form}
          initialValues={{ taronode: 'alice-taro' }}
        >
          <TaroNodeSelect
            name="taronode"
            label={'Select Taro Node'}
            networkNodes={network.nodes.taro}
            nodeStatus={Status.Started}
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
    const { getByText } = renderComponent();
    expect(getByText('Select Taro Node')).toBeInTheDocument();
    expect(getByText('alice-taro')).toBeInTheDocument();
  });
  it('should select and display bob-taro ', () => {
    const { getByText, getByLabelText, getAllByText, network } = renderComponent();
    console.log(network);
    fireEvent.mouseDown(getByLabelText('Select Taro Node'));
    fireEvent.click(getAllByText('bob-taro')[0]);
    expect(getAllByText('bob-taro')[0]).toBeInTheDocument();
  });
});
