import React, { useEffect } from 'react';
import { info } from 'electron-log';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Props {}

const NewNetwork: React.SFC<Props> = () => {
  useEffect(() => info('Rendering Home component'), []);

  return (
    <div>
      <h1>Create a new Lightning Network</h1>
    </div>
  );
};

export default NewNetwork;
