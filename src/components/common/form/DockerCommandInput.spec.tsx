import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Form } from 'antd';
import { getNetwork } from 'utils/tests';
import DockerCommandInput from './DockerCommandInput';

describe('DockerCommandInput', () => {
  const renderComponent = (initialValue?: string, defaultCommand = '') => {
    const network = getNetwork(1, 'test network');
    const TestForm = () => {
      const [form] = Form.useForm();
      return (
        <Form form={form} initialValues={{ command: initialValue }}>
          <DockerCommandInput
            form={form}
            name="command"
            defaultCommand={defaultCommand}
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

  it('should display the label and textarea', () => {
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Docker Startup Command')).toBeInTheDocument();
    expect(getByLabelText('Docker Startup Command')).toBeInTheDocument();
    expect(getByLabelText('Docker Startup Command')).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('should display the help and icons', () => {
    const { getByText, getByLabelText } = renderComponent();
    expect(
      getByText(
        'The docker command to execute when starting this node. If left blank, the default command will be used.',
      ),
    ).toBeInTheDocument();
    expect(getByLabelText('align-left')).toBeInTheDocument();
    expect(getByLabelText('stop')).toBeInTheDocument();
  });

  it('should set an initial value', () => {
    const { getByDisplayValue } = renderComponent('initial-command');
    expect(getByDisplayValue('initial-command')).toBeInTheDocument();
  });

  it('should populate when the pre-fill icon is clicked', async () => {
    const { getByLabelText } = renderComponent('initial', 'default-command');
    const input = getByLabelText('Docker Startup Command') as HTMLTextAreaElement;
    expect(input.value).toEqual('initial');
    fireEvent.click(getByLabelText('align-left'));
    expect(input.value).toEqual('default-command');
  });

  it('should populate when the pre-fill icon is clicked with no default command', async () => {
    const { getByLabelText } = renderComponent('initial', '');
    const input = getByLabelText('Docker Startup Command') as HTMLTextAreaElement;
    expect(input.value).toEqual('initial');
    fireEvent.click(getByLabelText('align-left'));
    expect(input.value).toEqual('');
  });

  it('should clear when the reset icon is clicked', async () => {
    const { getByLabelText } = renderComponent('initial');
    const input = getByLabelText('Docker Startup Command') as HTMLTextAreaElement;
    expect(input.value).toEqual('initial');
    fireEvent.click(getByLabelText('stop'));
    expect(input.value).toEqual('');
  });
});
