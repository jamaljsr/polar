import React from 'react';
import styled from '@emotion/styled';

interface Props {
  details: {
    label: string;
    value: React.ReactNode;
  }[];
}

const StyledDetails = styled.table`
  width: 100%;
  margin: 0;
`;

const StyledRow = styled.tr`
  border-bottom: 1px solid rgba(#000, 0.05);

  &:last-child {
    border-bottom-width: 0;
  }
`;

const StyledCell = styled.td`
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

const StyledLabel = styled(StyledCell)`
  padding-right: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.8;
`;

const StyledValue = styled(StyledCell)`
  font-size: 0.9rem;
  text-align: right;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;
`;

const DetailsList: React.SFC<Props> = ({ details }) => {
  return (
    <StyledDetails>
      <tbody>
        {details.map(d => (
          <StyledRow key={d.label}>
            <StyledLabel>{d.label}</StyledLabel>
            <StyledValue>{d.value}</StyledValue>
          </StyledRow>
        ))}
      </tbody>
    </StyledDetails>
  );
};

export default DetailsList;
