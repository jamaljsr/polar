import React from 'react';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { useStoreActions } from 'store';
import { Network } from 'types';

const Styled = {
  Button: styled(Button)`
    margin-left: 8px;
  `,
};

interface Props {
  network: Network;
}

const AutoBalanceButton: React.FC<Props> = ({ network }) => {
  const { autoBalanceChannels } = useStoreActions(s => s.network);
  const { notify } = useStoreActions(s => s.app);

  const handleClick = async () => {
    try {
      autoBalanceChannels({ id: network.id });
    } catch (error: any) {
      notify({ message: 'Failed to auto-balance channels', error });
    }
  };

  return <Styled.Button onClick={handleClick}>Auto Balance channels</Styled.Button>;
};

export default AutoBalanceButton;
