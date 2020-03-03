import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { RouteComponentProps } from 'react-router';
import { UploadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Card, PageHeader, Spin, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload';
import { usePrefixedTranslation } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions } from 'store';
import { ThemeColors } from 'theme/colors';
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

const ImportNetwork: React.FC<RouteComponentProps> = () => {
  const { navigateTo, notify } = useStoreActions(s => s.app);
  const { importNetwork } = useStoreActions(s => s.network);
  const { l } = usePrefixedTranslation('cmps.network.ImportNetwork');
  const doImportNetwork = useAsyncCallback(async (file: RcFile) => {
    try {
      const network = await importNetwork(file.path);
      notify({ message: l('importSuccess', { name: network.name }) });
      navigateTo(HOME);
    } catch (error) {
      notify({ message: l('importError', { file: file.name }), error });
    }

    return;
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
          disabled={doImportNetwork.loading}
          beforeUpload={doImportNetwork.execute}
        >
          {doImportNetwork.loading ? (
            <>
              <Spin size="large" />
              <p>{l('importText')}</p>
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
