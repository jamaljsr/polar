import React from 'react';
import { IPortsDefaultProps } from '@mrblenny/react-flow-chart';
import PortsGroup from './PortsGroup';

const Ports: React.FC<IPortsDefaultProps> = ({ children, config }) => {
  return (
    <div>
      <PortsGroup config={config} side="top">
        {children.filter(child => ['input', 'top'].includes(child.props.port.type))}
      </PortsGroup>
      <PortsGroup config={config} side="bottom">
        {children.filter(child => ['output', 'bottom'].includes(child.props.port.type))}
      </PortsGroup>
      <PortsGroup config={config} side="right">
        {children.filter(child => ['right'].includes(child.props.port.type))}
      </PortsGroup>
      <PortsGroup config={config} side="left">
        {children.filter(child => ['left'].includes(child.props.port.type))}
      </PortsGroup>
    </div>
  );
};

export default Ports;
