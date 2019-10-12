import React from 'react';
import styled from '@emotion/styled';

const Styled = {
  Outer: styled.span<{ width: number }>`
    display: inline-block;
    position: relative;
    width: ${props => props.width + 'px'};
    &::after {
      content: attr(data-right);
      position: absolute;
      left: 100%;
      top: 0;
    }
  `,
  Inner: styled.span`
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  `,
};

interface Props {
  text: string;
  rightChars: number;
  width: number;
}

const Ellipse: React.FC<Props> = ({ text, rightChars, width }) => {
  const right = text.length <= rightChars ? text : text.slice(-rightChars);
  return (
    <Styled.Outer data-right={right} width={width}>
      <Styled.Inner>{text}</Styled.Inner>
    </Styled.Outer>
  );
};

export default Ellipse;
