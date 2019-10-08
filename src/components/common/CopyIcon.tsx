import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from '@emotion/styled';
import { Icon, message } from 'antd';

const Styled = {
  Icon: styled(Icon)`
    color: #aaa;
  `,
};

interface Props {
  value: string;
  label?: string;
}

const CopyIcon: React.FC<Props> = ({ value, label }) => {
  return (
    <CopyToClipboard
      text={value}
      onCopy={() => message.success(`Copied ${label || ''} to clipboard`, 2)}
    >
      <Styled.Icon type="copy" />
    </CopyToClipboard>
  );
};

export default CopyIcon;
