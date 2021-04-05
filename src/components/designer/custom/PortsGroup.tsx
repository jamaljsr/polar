import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { IPortsGroupDefaultProps } from '@mrblenny/react-flow-chart';

const PortsGroup = styled.div<IPortsGroupDefaultProps>`
  position: absolute;
  display: flex;
  justify-content: center;
  ${props => {
    if (props.side === 'top') {
      return css`
        width: 100%;
        left: 0;
        top: -9px;
        flex-direction: row;
        > div {
          margin: 0 3px;
        }
      `;
    } else if (props.side === 'bottom') {
      return css`
        width: 100%;
        left: 0;
        bottom: -9px;
        flex-direction: row;
        > div {
          margin: 0 3px;
        }
      `;
    } else if (props.side === 'left') {
      return css`
        height: 100%;
        top: 0;
        left: -9px;
        flex-direction: column;
        > div {
          margin: 3px 0;
        }
      `;
    } else {
      return css`
        height: 100%;
        top: 0;
        right: -9px;
        flex-direction: column;
        > div {
          margin: 3px 0;
        }
      `;
    }
  }}
`;

export default PortsGroup;
