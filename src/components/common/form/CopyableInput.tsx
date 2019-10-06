import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Icon, Input, message } from 'antd';

interface Props {
  value: string;
  name?: string;
}

const CopyableInput: React.FC<Props> = ({ value, name }) => {
  const addon = (
    <CopyToClipboard
      text={value}
      onCopy={() => message.success(`Copied ${name || ''} to clipboard`, 2)}
    >
      <Icon type="copy" onClick={() => {}} />
    </CopyToClipboard>
  );

  return <Input readOnly value={value} addonAfter={addon} />;
};

export default CopyableInput;
