import React from 'react';
import styled from '@emotion/styled';

const Styled = {
  Details: styled.table`
    width: 100%;
    margin: 0 0 30px 0;
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
  LabelRow: styled.td`
    padding-top: 0.5rem;
    padding-bottom: 0.2rem;
    padding-right: 0.5rem;
    font-size: 0.8rem;
    opacity: 0.8;
  `,
  ValueRow: styled.td`
    font-size: 0.9rem;
    font-weight: 500;
    text-align: right;
    padding-bottom: 0.5rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
};

export type DetailValues = {
  label: React.ReactNode;
  value: React.ReactNode;
}[];

interface Props {
  details: DetailValues;
  title?: React.ReactNode;
  oneCol?: boolean;
  className?: string;
}

const DetailsList: React.FC<Props> = ({ details, title, oneCol, className }) => {
  return (
    <>
      {title && <h3>{title}</h3>}
      <Styled.Details className={className}>
        <tbody>
          {details.map((d, i) =>
            oneCol ? (
              <React.Fragment key={i}>
                <Styled.Row>
                  <Styled.LabelRow>{d.label}</Styled.LabelRow>
                </Styled.Row>
                <Styled.Row>
                  <Styled.ValueRow>{d.value}</Styled.ValueRow>
                </Styled.Row>
              </React.Fragment>
            ) : (
              <Styled.Row key={i}>
                <Styled.LabelCell>{d.label}</Styled.LabelCell>
                <Styled.ValueCell>{d.value}</Styled.ValueCell>
              </Styled.Row>
            ),
          )}
        </tbody>
      </Styled.Details>
    </>
  );
};

export default DetailsList;
