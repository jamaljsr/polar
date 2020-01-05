import React from 'react';
import styled from '@emotion/styled';
import { REACT_FLOW_CHART } from '@mrblenny/react-flow-chart';

const Styled = {
  Node: styled.div`
    display: flex;
    justify-content: space-between;
    border: 1px solid #303030;
    border-radius: 4px;
    box-shadow: 4px 2px 9px rgba(100, 100, 100, 0.1);
    cursor: move;
    overflow: hidden;
    transition: all 0.3s ease-out;
    opacity: 1;
    height: 46px;
    padding: 10px 10px;
    margin-top: 20px;

    &.hide {
      opacity: 0;
      height: 0;
      padding: 0 10px;
      margin-top: 0;
    }
  `,
  Label: styled.span`
    flex: 1;
    padding-left: 10px;
    font-weight: bold;
  `,
  Desc: styled.sup`
    font-weight: normal;
    opacity: 0.7;
  `,
  Logo: styled.img`
    width: 24px;
    height: 24px;
  `,
};

interface Props {
  label: string;
  desc?: string;
  icon: string;
  properties: any;
  visible: boolean;
}

const DraggableNode: React.FC<Props> = ({ label, desc, icon, properties, visible }) => {
  return (
    <Styled.Node
      draggable
      onDragStart={event => {
        event.dataTransfer.setData(REACT_FLOW_CHART, JSON.stringify(properties));
      }}
      className={!visible ? 'hide' : ''}
    >
      <Styled.Label>
        {label} {desc && <Styled.Desc>{desc}</Styled.Desc>}
      </Styled.Label>
      <Styled.Logo src={icon} alt={label} />
    </Styled.Node>
  );
};

export default DraggableNode;
