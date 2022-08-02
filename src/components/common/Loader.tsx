import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';

interface Props {
  inline?: boolean;
  /** the font size of the icon (in rem units) */
  size?: number;
}

const Loader: React.FC<Props> = ({ inline, size = 2 }) => {
  const absStyles: React.CSSProperties = inline
    ? {}
    : {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: `-${size / 2}rem`,
        marginLeft: `-${size / 2}rem`,
      };
  return (
    <LoadingOutlined
      style={{
        color: '#ffa940',
        fontSize: `${size}rem`,
        ...absStyles,
      }}
    />
  );
};

export default Loader;
