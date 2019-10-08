import React from 'react';
import { Input } from 'antd';
import CopyIcon from '../CopyIcon';

interface Props {
  value: string;
  label?: string;
}

const CopyableInput: React.FC<Props> = ({ value, label }) => {
  return (
    <Input readOnly value={value} addonAfter={<CopyIcon value={value} label={label} />} />
  );
};

export default CopyableInput;
