import styled from '@emotion/styled';
import { Card } from 'antd';

export default styled(Card)`
  position: absolute;
  top: 16px;
  bottom: 16px;
  right: 16px;
  width: 360px;
  border-radius: 2px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  overflow: auto;

  &::-webkit-scrollbar {
    width: 8px;
    background-color: rgba(0, 0, 0, 0);
    border-radius: 10px;
  }

  &::-webkit-scrollbar:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  &::-webkit-scrollbar-thumb:vertical {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:vertical:active {
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 10px;
  }
`;
