import React from 'react';
import styled from '@emotion/styled';
import { INodeInnerDefaultProps, ISize } from '@mrblenny/react-flow-chart';
import { useTheme } from 'hooks/useTheme';
import { useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { LOADING_NODE_ID } from 'utils/constants';
import { Loader, StatusBadge } from 'components/common';
import torIcon from '../../../resources/onion.png';
import NodeContextMenu from '../NodeContextMenu';

const Styled = {
  Node: styled.div<{ size?: ISize; colors: ThemeColors['node']; isSelected: boolean }>`
    ${props =>
      props.isSelected ? 'box-shadow: 5px 5px 20px rgb(255 147 40 / 40%)' : null};
    border: 1px solid ${({ colors }) => colors.border};
    border-radius: 2px;
    background-color: ${({ colors }) => colors.background};
    padding: 20px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: ${({ size }) => (size ? `${size.height}px` : 'auto')};
    width: ${({ size }) => (size ? `${size.width}px` : 'auto')};
    &:hover {
      cursor: grab;
    }
  `,
  IconContainer: styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
  `,
};

const CustomNodeInner: React.FC<INodeInnerDefaultProps> = ({ node }) => {
  const theme = useTheme();
  const chart = useStoreState(s => s.designer.activeChart);
  const isSelected =
    chart && chart.selected.type === 'node' && chart.selected.id === node.id;

  return node.id === LOADING_NODE_ID ? (
    <Styled.Node size={node.size} colors={theme.node} isSelected={isSelected}>
      <Loader size={1} />
    </Styled.Node>
  ) : (
    <NodeContextMenu node={node}>
      <Styled.Node size={node.size} colors={theme.node} isSelected={isSelected}>
        <span>
          <StatusBadge text={node.id} status={node.properties.status} />
        </span>
        <div style={{ position: 'relative' }}>
          <img src={node.properties.icon} style={{ width: 24, height: 24 }} alt="" />
          {node.properties.tor && (
            <img
              src={torIcon}
              style={{
                position: 'absolute',
                width: 20,
                height: 20,
                bottom: -16,
                right: -16,
              }}
              alt="Tor"
            />
          )}
        </div>
      </Styled.Node>
    </NodeContextMenu>
  );
};

export default CustomNodeInner;
