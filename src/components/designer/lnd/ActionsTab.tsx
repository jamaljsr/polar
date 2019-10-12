import React from 'react';
import { Button, Form, Icon } from 'antd';
import { useStoreActions } from 'store';
import { LndNode, Status } from 'types';
import LndDeposit from './LndDeposit';

interface Props {
  node: LndNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  const { showOpenChannel } = useStoreActions(s => s.modals);

  if (node.status !== Status.Started) {
    return <>Node needs to be started to perform actions on it</>;
  }

  return (
    <>
      {node.status === Status.Started && (
        <>
          <LndDeposit node={node} />
          <Form.Item label="Open Channel">
            <Button.Group style={{ width: '100%' }}>
              <Button
                type="primary"
                style={{ width: '50%' }}
                onClick={() => showOpenChannel({ to: node.name })}
              >
                <Icon type="download" />
                Incoming
              </Button>
              <Button
                type="primary"
                style={{ width: '50%' }}
                onClick={() => showOpenChannel({ from: node.name })}
              >
                <Icon type="upload" />
                Outgoing
              </Button>
            </Button.Group>
          </Form.Item>
        </>
      )}
    </>
  );
};

export default ActionsTab;
