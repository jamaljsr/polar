import React from 'react';
import styled from '@emotion/styled';
import { REACT_FLOW_CHART } from '@mrblenny/react-flow-chart';
import { useTheme } from 'hooks/useTheme';
import { ThemeColors } from 'theme/colors';

const Styled = {
  Node: styled.div<{ colors: ThemeColors['dragNode'] }>`
    display: flex;
    justify-content: space-between;
    border: 1px solid ${props => props.colors.border};
    border-radius: 4px;
    box-shadow: 4px 2px 9px ${props => props.colors.shadow};
    cursor: move;
    overflow: hidden;
    transition: all 0.3s ease-out;
    opacity: 1;
    height: 46px;
    padding: 10px 10px;
    margin-top: 20px;
    flex-grow: 1;

    &.hide {
      opacity: 0;
      height: 0;
      padding: 0 10px;
      margin-top: 0;
      border-width: 0;
    }
  `,
  Label: styled.span`
    flex: 1;
    padding-left: 10px;
    font-weight: bold;
  `,
  Logo: styled.img`
    width: 24px;
    height: 24px;
  `,
};

interface Props {
  label: string;
  icon: string;
  properties: any;
  visible: boolean;
}

const DraggableNode: React.FC<Props> = ({ label, icon, properties, visible }) => {
  const theme = useTheme();
  return (
    <Styled.Node
      draggable
      onDragStart={event => {
        event.dataTransfer.setData(REACT_FLOW_CHART, JSON.stringify(properties));
      }}
      className={!visible ? 'hide' : ''}
      colors={theme.dragNode}
    >
      <Styled.Label>{label}</Styled.Label>
      <Styled.Logo src={icon} alt={label} />
    </Styled.Node>
  );
};

export default DraggableNode;
