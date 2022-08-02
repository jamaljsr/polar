import React from 'react';
import styled from '@emotion/styled';
import { INodeInnerDefaultProps, ISize } from '@mrblenny/react-flow-chart';
import { useTheme } from 'hooks/useTheme';
import { ThemeColors } from 'theme/colors';
import { LOADING_NODE_ID } from 'utils/constants';
import { Loader, StatusBadge } from 'components/common';
import NodeContextMenu from '../NodeContextMenu';

const Styled = {
  Node: styled.div<{ size?: ISize; colors: ThemeColors['node'] }>`
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
};

const CustomNodeInner: React.FC<INodeInnerDefaultProps> = ({ node }) => {
  const theme = useTheme();

  return node.id === LOADING_NODE_ID ? (
    <Styled.Node size={node.size} colors={theme.node}>
      <Loader size={1} />
    </Styled.Node>
  ) : (
    <NodeContextMenu node={node}>
      <Styled.Node size={node.size} colors={theme.node}>
        <span>
          <StatusBadge text={node.id} status={node.properties.status} />
        </span>
        <img src={node.properties.icon} style={{ width: 24, height: 24 }} alt="" />
      </Styled.Node>
    </NodeContextMenu>
  );
};

export default CustomNodeInner;
