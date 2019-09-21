import React from 'react';
import styled from '@emotion/styled';
import { BitcoinNode, Status } from 'types';
import { DetailsList } from 'components/common';

const Styled = {
  Details: styled.div`
    margin-top: 30px;
  `,
};

const BitcoindDetails: React.FC<{ node: BitcoinNode }> = ({ node }) => {
  const details = [
    { label: 'Name', value: node.name },
    { label: 'Status', value: Status[node.status] },
  ];

  return (
    <Styled.Details>
      <DetailsList details={details} />
    </Styled.Details>
  );
};

export default BitcoindDetails;
