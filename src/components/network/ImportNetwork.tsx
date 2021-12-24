import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { UploadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Card, PageHeader, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions } from 'store';
import { ThemeColors } from 'theme/colors';
import { Loader } from 'components/common';
import { HOME } from 'components/routing';

const Styled = {
  Container: styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  PageHeader: styled(PageHeader)<{ colors: ThemeColors['pageHeader'] }>`
    border: 1px solid ${props => props.colors.border};
    border-radius: 2px;
    background-color: ${props => props.colors.background};
    margin-bottom: 10px;
    flex: 0;
  `,
  Card: styled(Card)`
    flex: 1;
  `,
  Dragger: styled(Upload.Dragger)`
    flex: 1;
  `,
};

const ImportNetwork: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.network.ImportNetwork');
  const { navigateTo, navigateToNetwork, notify } = useStoreActions(s => s.app);
  const { importNetwork } = useStoreActions(s => s.network);
  const importAsync = useAsyncCallback(async (file: RcFile) => {
    try {
      const network = await importNetwork(file.path);
      notify({ message: l('importSuccess', { name: network.name }) });
      await navigateToNetwork(network.id);
    } catch (error: any) {
      notify({ message: l('importError', { file: file.name }), error });
    }
  });

  const theme = useTheme();
  return (
    <Styled.Container>
      <Styled.PageHeader
        title={l('title')}
        colors={theme.pageHeader}
        onBack={() => navigateTo(HOME)}
      />
      <Styled.Card bodyStyle={{ height: '100%' }}>
        <Styled.Dragger
          // to not display a file in the upload dragger after the user has selected a zip
          fileList={undefined}
          accept=".zip"
          disabled={importAsync.loading}
          beforeUpload={file => {
            importAsync.execute(file);
            return false;
          }}
        >
          {importAsync.loading ? (
            <>
              <Loader />
            </>
          ) : (
            <>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">{l('fileDraggerArea')}</p>
            </>
          )}
        </Styled.Dragger>
      </Styled.Card>
    </Styled.Container>
  );
};

export default ImportNetwork;
