import React from 'react';
import styled from '@emotion/styled';
import { useStoreState } from 'store';

const Styled = {
  Status: styled.div`
    display: inline-block;
    line-height: 32px;
    height: 32px;
    padding: 0 15px;
    font-size: 12px;

    > span {
      margin-right: 15px;
    }
  `,
};

const Status: React.FC = () => {
  const {
    dockerVersions: { docker, compose },
  } = useStoreState(s => s.app);

  return (
    <Styled.Status>
      {docker && <span>Docker v{docker}</span>}
      {compose && <span>Compose v{compose}</span>}
    </Styled.Status>
  );
};

export default Status;
