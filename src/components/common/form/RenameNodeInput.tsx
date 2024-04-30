import React from 'react';
import { Form, Input } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { usePrefixedTranslation } from 'hooks';

interface Props {
  form: FormInstance;
  name: string;
  defaultName?: string;
  disabled?: boolean;
}

const RenameNodeInput: React.FC<Props> = ({ name, defaultName, disabled }) => {
  const { l } = usePrefixedTranslation('cmps.common.form.RenameNodeInput');
  return (
    <Form.Item name={name} label={l('label')}>
      <Input
        value={name}
        defaultValue={defaultName}
        placeholder="Enter node name"
        disabled={disabled}
      />
    </Form.Item>
  );
};

export default RenameNodeInput;
