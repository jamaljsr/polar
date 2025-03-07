import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Form } from 'antd';
import { LightningNodeModel } from 'store/models/lightning';
import { defaultStateBalances, getNetwork } from 'utils/tests';
import LightningNodeSelect from './LightningNodeSelect';

describe('LightningNodeSelect', () => {
  const renderComponent = (
    initialNodes?: { [key: string]: LightningNodeModel },
    initialValue?: string,
  ) => {
    const network = getNetwork(1, 'test network');
    const nodes = initialNodes || {
      alice: {},
    };
    const TestForm = () => {
      const [form] = Form.useForm();
      return (
        <Form form={form} initialValues={{ from: initialValue }}>
          <LightningNodeSelect
            network={network}
            name="from"
            label="Source"
            initialValue={initialValue}
            implementations={['LND']}
            nodes={nodes}
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
    expect(getByText('Source')).toBeInTheDocument();
    expect(getByLabelText('Source')).toBeInTheDocument();
  });

  it('should display the initial nodes balance', () => {
    const nodes = {
      alice: {
        walletBalance: defaultStateBalances({ confirmed: '100' }),
      },
    };
    const { getByText } = renderComponent(nodes, 'alice');
    expect(getByText('Balance: 100 sats')).toBeInTheDocument();
  });

  it('should display the selected nodes balance', async () => {
    const nodes = {
      alice: {
        walletBalance: defaultStateBalances({ confirmed: '100' }),
      },
      dave: {
        walletBalance: defaultStateBalances({ confirmed: '200' }),
      },
    };
    const { findByText, getAllByText, getByText, getByLabelText } = renderComponent(
      nodes,
      'alice',
    );
    // confirm the initial balance is displayed
    expect(getByText('Balance: 100 sats')).toBeInTheDocument();
    // open the dropdown
    fireEvent.mouseDown(getByLabelText('Source'));
    // click on bob option
    // Select renders two lists of the options to the dom. click on the
    // second one if it exists, otherwise click the only one
    fireEvent.click(getAllByText('dave')[1]);
    // confirm the balance updates
    expect(await findByText('Balance: 200 sats')).toBeInTheDocument();
  });
});
