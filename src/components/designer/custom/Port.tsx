import React from 'react';
import styled from '@emotion/styled';
import { IPortDefaultProps } from '@mrblenny/react-flow-chart';
import { Tooltip } from 'antd';

const Outer = styled.div<{ type: string }>`
  width: 18px;
  height: 18px;
  ${props => props.type && `border-${props.type}: 2px solid #303030;`}
  border-radius: 50%;
  background: #1f1f1f;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover > div {
    width: 10px;
    height: 10px;
  }
`;

const Inner = styled.div<{ color: string; active: boolean }>`
  width: ${props => (props.active ? '10px' : '7px')};
  height: ${props => (props.active ? '10px' : '7px')};
  border-radius: 50%;
  background: ${props => props.color};
  cursor: pointer;
  transition: all 0.3s;
`;

const CustomPort: React.FC<IPortDefaultProps> = ({
  port,
  isLinkSelected,
  isLinkHovered,
}) => {
  let color = '#383838';
  let tip = '';
  if (port.properties) {
    color = port.properties.initiator ? '#52c41a' : '#6495ED';
    tip = port.properties.initiator ? 'Source' : 'Destination';
  }
  return (
    <Tooltip title={tip}>
      <Outer type={port.type}>
        <Inner color={color} active={isLinkSelected || isLinkHovered} />
      </Outer>
    </Tooltip>
  );
};

export default CustomPort;
