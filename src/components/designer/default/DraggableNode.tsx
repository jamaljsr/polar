import React from 'react';
import styled from '@emotion/styled';
import { REACT_FLOW_CHART } from '@mrblenny/react-flow-chart';

const Styled = {
  Node: styled.div`
    display: flex;
    justify-content: space-between;
    margin: 20px 0;
    padding: 15px 20px;
    border: 1px solid #e8e8e8;
    border-radius: 3px;
    box-shadow: 4px 2px 9px rgba(0, 0, 0, 0.1);
    cursor: move;
  `,
  Icon: styled.img`
    width: 24px;
    height: 24px;
  `,
};

interface Props {
  label: string;
  icon: string;
  properties: any;
}

const DraggableNode: React.FC<Props> = ({ label, icon, properties }) => {
  return (
    <Styled.Node
      draggable
      onDragStart={event => {
        event.dataTransfer.setData(REACT_FLOW_CHART, JSON.stringify(properties));
      }}
    >
      <span>{label}</span>
      <Styled.Icon src={icon} alt={label} />
    </Styled.Node>
  );
};

export default DraggableNode;
