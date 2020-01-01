import React from 'react';
import styled from '@emotion/styled';
import { useStoreState } from 'store';
import { APP_VERSION } from 'utils/constants';

const Styled = {
  DockerStatus: styled.div`
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

const DockerStatus: React.FC = () => {
  const {
    dockerVersions: { docker, compose },
  } = useStoreState(s => s.app);

  return (
    <Styled.DockerStatus>
      <span>Polar v{APP_VERSION}</span>
      {docker && <span>Docker v{docker}</span>}
      {compose && <span>Compose v{compose}</span>}
    </Styled.DockerStatus>
  );
};

export default DockerStatus;
