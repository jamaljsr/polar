import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import styled from '@emotion/styled';
import { Radio } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { LndNode, Status } from 'types';
import { readHex } from 'utils/files';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

const Styled = {
  RadioGroup: styled(Radio.Group)`
    display: flex;
    justify-content: center;
    font-size: 12px;
  `,
};

interface Props {
  node: LndNode;
}

type ValuesList = [string, string, string, boolean][];

const ConnectTab: React.FC<Props> = ({ node }) => {
  const { notify } = useStoreActions(s => s.app);
  const [fileType, setFileType] = useState<string>('paths');
  const [hexValues, setHexValues] = useState<Record<string, string>>({});
  useAsync(async () => {
    const { tlsCert, adminMacaroon, readonlyMacaroon } = node.paths;
    try {
      setHexValues({
        tlsCert: await readHex(tlsCert),
        adminMacaroon: await readHex(adminMacaroon),
        readonlyMacaroon: await readHex(readonlyMacaroon),
      });
    } catch (error) {
      notify({ message: 'Failed to hex encode file contents', error });
    }
  }, [node.paths]);

  let lnUrl = '';
  const nodeState = useStoreState(s => s.lnd.nodes[node.name]);
  if (nodeState && nodeState.info) {
    lnUrl = nodeState.info.uris[0];
  }

  if (node.status !== Status.Started) {
    return <>Node needs to be started to view connection info</>;
  }

  const isPaths = fileType === 'paths';
  const values = isPaths ? node.paths : hexValues;

  const grpcHost = `127.0.0.1:${node.ports.grpc}`;
  const restHost = `https://127.0.0.1:${node.ports.rest}`;
  const hosts: DetailValues = ([
    ['GRPC Host', grpcHost, grpcHost, false],
    ['REST Host', restHost, restHost, false],
    ['P2P LN Url', lnUrl, ellipseInner(lnUrl, 3, 19), true],
  ] as ValuesList).map(([label, value, text, tip]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} tip={tip} />,
  }));

  const { tlsCert, adminMacaroon: admin, readonlyMacaroon: read } = values;
  const [left, right] = isPaths ? [16, 22] : [15, 15];
  const auth: DetailValues = [
    ['TLS Cert', tlsCert, ellipseInner(tlsCert, left, right)],
    ['Admin Macaroon', admin, ellipseInner(admin, left, right)],
    ['Read-only Macaroon', read, ellipseInner(read, left, right)],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} tip />,
  }));

  return (
    <>
      <DetailsList details={hosts} />
      <Styled.RadioGroup
        name="fileType"
        defaultValue={fileType}
        size="small"
        onChange={e => setFileType(e.target.value)}
      >
        <Radio.Button value="paths">File Paths</Radio.Button>
        <Radio.Button value="hex">HEX Strings</Radio.Button>
      </Styled.RadioGroup>
      <DetailsList details={auth} oneCol />
    </>
  );
};

export default ConnectTab;
