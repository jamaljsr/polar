import React from 'react';
import styled from '@emotion/styled';
import { IPortDefaultProps } from '@mrblenny/react-flow-chart';
import { Tooltip } from 'antd';
import { useTheme } from 'hooks/useTheme';
import { ThemeColors } from 'theme/colors';

const Outer = styled.div<{ type: string; colors: ThemeColors['port'] }>`
  width: 18px;
  height: 18px;
  ${props => props.type && `border-${props.type}: 2px solid ${props.colors.border};`}
  border-radius: 50%;
  background: ${props => props.colors.outer};
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
  const theme = useTheme();
  let color = theme.port.inner;
  let tip = '';
  if (port.properties) {
    const { initiator, hasAssets } = port.properties;
    const colors = hasAssets ? theme.channel.asset : theme.channel.bitcoin;
    color = initiator ? colors.local : colors.remote;
    tip = initiator ? 'Source' : 'Destination';
  }
  return (
    <Tooltip title={tip}>
      <Outer type={port.type} colors={theme.port}>
        <Inner color={color} active={isLinkSelected || isLinkHovered} />
      </Outer>
    </Tooltip>
  );
};

export default CustomPort;
