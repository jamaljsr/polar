import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';

const Styled = {
  Icon: styled(QuestionCircleOutlined)`
    margin-left: 5px;
    color: #aaa;
  `,
};

interface Props {
  label: string;
  containerAddress: string;
}

/**
 * Displays a host label with a tooltip explaining that the address only works
 * from the host machine, and which address to use from inside docker
 */
const HostLabel: React.FC<Props> = ({ label, containerAddress }) => {
  const { l } = usePrefixedTranslation('cmps.common.HostLabel');
  return (
    <>
      {label}
      <Tooltip title={l('hint', { containerAddress })}>
        <Styled.Icon aria-label={l('ariaLabel', { label })} />
      </Tooltip>
    </>
  );
};

export default HostLabel;
