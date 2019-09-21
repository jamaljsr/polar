import React from 'react';
import styled from '@emotion/styled';

const Styled = {
  Details: styled.table`
    width: 100%;
    margin: 0;
  `,
  Row: styled.tr`
    border-bottom: 1px solid rgba(#000, 0.05);

    &:last-child {
      border-bottom-width: 0;
    }
  `,
  LabelCell: styled.td`
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-right: 0.5rem;
    font-size: 0.8rem;
    opacity: 0.8;
  `,
  ValueCell: styled.td`
    font-size: 0.9rem;
    font-weight: 500;
    text-align: right;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 200px;
  `,
};

export type DetailValues = {
  label: React.ReactNode;
  value: React.ReactNode;
}[];

interface Props {
  details: DetailValues;
}

const DetailsList: React.SFC<Props> = ({ details }) => {
  return (
    <Styled.Details>
      <tbody>
        {details.map((d, i) => (
          <Styled.Row key={i}>
            <Styled.LabelCell>{d.label}</Styled.LabelCell>
            <Styled.ValueCell>{d.value}</Styled.ValueCell>
          </Styled.Row>
        ))}
      </tbody>
    </Styled.Details>
  );
};

export default DetailsList;
