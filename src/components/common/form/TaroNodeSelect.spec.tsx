import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Form } from 'antd';
import { Status } from 'shared/types';
import { getNetwork } from 'utils/tests';
import TaroNodeSelect from './TaroNodeSelect';

describe('TaroNodeSelect', () => {
  const renderComponent = () => {
    const network = getNetwork(1, 'test network', Status.Stopped, 3);
    const TestForm = () => {
      const [form] = Form.useForm();
      return (
        <Form form={form}>
          <TaroNodeSelect
            network={network}
            name={'from'}
            label={'Taro Nodes'}
            nodeStatus={Status.Stopped}
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
    expect(getByText('Taro Nodes')).toBeInTheDocument();
    expect(getByLabelText('Taro Nodes')).toBeInTheDocument();
  });

  it('should display the nodes', async () => {
    const { getAllByText, getByLabelText } = renderComponent();
    fireEvent.mouseDown(getByLabelText('Taro Nodes'));
    expect(getAllByText('alice-taro')[0]).toBeInTheDocument();
    expect(getAllByText('bob-taro')[0]).toBeInTheDocument();
    expect(getAllByText('carol-taro')[0]).toBeInTheDocument();
    fireEvent.click(getAllByText('carol-taro')[0]);
  });
});
