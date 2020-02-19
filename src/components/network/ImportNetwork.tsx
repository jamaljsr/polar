import React, { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Card, PageHeader, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions } from 'store';
import { ThemeColors } from 'theme/colors';
import { HOME } from 'components/routing';

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
};

const ImportNetwork: React.SFC = () => {
  const [file, setFile] = useState<RcFile | undefined>();
  const { navigateTo, notify } = useStoreActions(s => s.app);
  const { importNetwork } = useStoreActions(s => s.network);
  const { l } = usePrefixedTranslation('cmps.network.ImportNetwork');

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
          <Button onClick={() => setFile(undefined)} disabled={!file}>
            {l('removeButton')}
          </Button>
          <Button
            onClick={async () => {
              try {
                // if file is undefined, export button is disabled
                // so we can be sure that this assertions is OK
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                await importNetwork(file!.path);
                notify({ message: l('importSuccess') });
                navigateTo(HOME);
              } catch (error) {
                notify({ message: '', error });
              }
            }}
            type="primary"
            disabled={!file}
          >
            {l('importButton')}
          </Button>
        </Styled.ButtonContainer>
      </Card>
    </>
  );
};

export default ImportNetwork;
