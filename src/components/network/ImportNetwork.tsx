import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button, Upload, Card, PageHeader, Spin, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import log from 'electron-log';
import { ThemeColors } from 'theme/colors';
import { useTheme } from 'hooks/useTheme';
import { HOME } from 'components/routing';
import { useStoreActions, useStoreState } from 'store';
import { usePrefixedTranslation } from 'hooks';
import { RcFile } from 'antd/lib/upload';
import { getNetworkFromZip } from 'utils/network';
import fsExtra from 'fs-extra';
import { promises as fs } from 'fs';
import { join } from 'path';
import { dataPath } from 'utils/config';

const Styled = {
  PageHeader: styled(PageHeader)<{ colors: ThemeColors['pageHeader'] }>`
    border: 1px solid ${props => props.colors.border};
    border-radius: 2px;
    background-color: ${props => props.colors.background};
    margin-bottom: 10px;
    flex: 0;
  `,
  ButtonContainer: styled.div`
    margin-top: 20px;
    display: flex;
    justify-content: space-evenly;

    button {
      width: 200px;
    }
  `,
  Spin: styled(Spin)<{ visible: boolean }>`
    position: absolute;
    display: ${visible => (visible ? 'inherit' : 'none')};
  `,
};

const ImportNetwork: React.SFC = () => {
  const [file, setFile] = useState<RcFile | undefined>();
  const { navigateTo } = useStoreActions(s => s.app);
  const { l } = usePrefixedTranslation('cmps.network.ImportNetwork');
  const networkActions = useStoreActions(s => s.network);
  const designerActions = useStoreActions(s => s.designer);

  const { networks } = useStoreState(s => s.network);

  const theme = useTheme();
  return (
    <>
      <Styled.PageHeader
        title={l('title')}
        colors={theme.pageHeader}
        onBack={() => navigateTo(HOME)}
      />
      <Card>
        <Upload.Dragger
          fileList={file ? [file] : []}
          accept=".zip"
          onRemove={async () => {
            setFile(undefined);

            // return false makes the operation stop. we don't want to actually
            // interact with a server, just operate in memory
            return false;
          }}
          beforeUpload={file => {
            setFile(file);

            // return false makes the upload stop. we don't want to actually
            // upload this file anywhere, just store it in memory
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">{l('fileDraggerArea')}</p>
        </Upload.Dragger>
        <Styled.ButtonContainer>
          <Button onClick={() => setFile(undefined)} disabled={file === undefined}>
            {l('removeButton')}
          </Button>
          <Button
            onClick={async () => {
              if (!file) {
                throw Error('File was undefined in import submit function!');
              }

              const maxId = networks
                .map(n => n.id)
                .reduce((max, curr) => Math.max(max, curr), 0);
              const newId = maxId + 1;

              const [newNetwork, chart, unzippedFilesDirectory] = await getNetworkFromZip(
                file.path,
                newId,
              );

              const newNetworkDirectory = join(dataPath, 'networks', newId.toString());
              await fs.mkdir(newNetworkDirectory, { recursive: true });

              const thingsToCopy = ['docker-compose.yml', 'volumes'];
              await Promise.all(
                thingsToCopy.map(path =>
                  fsExtra.copy(
                    join(unzippedFilesDirectory, path),
                    join(newNetworkDirectory, path),
                  ),
                ),
              );

              networkActions.add(newNetwork);
              designerActions.setChart({ chart, id: newId });
              await networkActions.save();

              log.info('imported', newNetwork);
              Modal.success({
                title: 'Imported network',
                content: `Imported network '${newNetwork.name}' successfully.`,
                onOk: () => navigateTo(HOME),
              });
            }}
            type="primary"
            disabled={file === undefined}
          >
            {l('importButton')}
          </Button>
        </Styled.ButtonContainer>
      </Card>
    </>
  );
};

export default ImportNetwork;
