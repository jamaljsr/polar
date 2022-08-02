import React, { useCallback } from 'react';
import { CloudSyncOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    color: inherit;
    padding: 0 10px 0 0;
    &:focus,
    &:active {
      color: inherit;
    }
  `,
};

const CheckForUpdatesButton: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.layouts.CheckForUpdatesButton');
  const { showImageUpdates } = useStoreActions(s => s.modals);

  const handleClick = useCallback(() => showImageUpdates(), []);

  return (
    <Styled.Button type="link" onClick={handleClick}>
      <CloudSyncOutlined />
      {l('updates')}
    </Styled.Button>
  );
};

export default CheckForUpdatesButton;
