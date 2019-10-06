import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Icon, message } from 'antd';

interface Props {
  value: string;
  name?: string;
}

const CopyIcon: React.FC<Props> = ({ value, name }) => {
  return (
    <CopyToClipboard
      text={value}
      onCopy={() => message.success(`Copied ${name || ''} to clipboard`, 2)}
    >
      <Icon type="copy" style={{ color: '#aaa' }} />
    </CopyToClipboard>
  );
};

export default CopyIcon;
