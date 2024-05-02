import React from 'react';
import { Input } from 'antd';
import { FormInstance } from 'antd/lib/form';
// import { usePrefixedTranslation } from 'hooks';

interface Props {
  form: FormInstance;
  name: string;
  defaultName?: string;
  disabled?: boolean;
}

const RenameNodeInput: React.FC<Props> = ({ defaultName, disabled }) => {
  return (
    <Input
      // value={name}
      defaultValue={defaultName}
      placeholder="Enter node name"
      disabled={disabled}
    />
  );
};

export default RenameNodeInput;
