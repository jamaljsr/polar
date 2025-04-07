import styled from '@emotion/styled';
import { ICanvasOuterDefaultProps } from '@mrblenny/react-flow-chart';

export const CanvasOuterDark = styled.div<ICanvasOuterDefaultProps>`
  position: relative;
  background-size: 20px 20px;
  background-image: linear-gradient(90deg, hsla(0, 0%, 25%, 0.05) 1px, transparent 0),
    linear-gradient(180deg, hsla(0, 0%, 25%, 0.05) 1px, transparent 0);
  width: 100%;
  overflow: hidden;
  cursor: not-allowed;
`;

export const CanvasOuterLight = styled.div<ICanvasOuterDefaultProps>`
  position: relative;
  background-size: 20px 20px;
  background-color: #e7ecf1;
  background-image: linear-gradient(90deg, hsla(0, 0%, 100%, 0.2) 1px, transparent 0),
    linear-gradient(180deg, hsla(0, 0%, 100%, 0.2) 1px, transparent 0);
  width: 100%;
  overflow: hidden;
  cursor: not-allowed;
`;
