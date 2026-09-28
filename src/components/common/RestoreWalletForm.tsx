import React from 'react';
import { basename } from 'path';
import { UploadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Button, Form, Input, Upload } from 'antd';
import { usePrefixedTranslation } from 'hooks';

const Styled = {
  Attached: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  Alert: styled(Alert)`
    margin-bottom: 16px;
  `,
};

const SEED_WORD_COUNT = 24;

export const splitSeedWords = (phrase: string): string[] =>
  phrase.trim().split(/\s+/).filter(Boolean);

interface Props {
  disabled?: boolean;
  backupFilePath?: string;
  onBackupChange: (filePath?: string) => void;
}

const RestoreWalletForm: React.FC<Props> = ({
  disabled,
  backupFilePath,
  onBackupChange,
}) => {
  const { l } = usePrefixedTranslation('cmps.common.RestoreWalletForm');

  // reject anything other than exactly 24 words before an RPC is attempted
  const validateMnemonic = async (_: unknown, value?: string) => {
    if (splitSeedWords(value || '').length !== SEED_WORD_COUNT) {
      throw new Error(l('wordCount', { count: SEED_WORD_COUNT }));
    }
  };

  return (
    <>
      <Form.Item
        name="mnemonic"
        label={l('mnemonicLabel')}
        rules={[{ validator: validateMnemonic }]}
      >
        <Input.TextArea
          rows={4}
          placeholder={l('mnemonicPlaceholder')}
          disabled={disabled}
        />
      </Form.Item>
      <Form.Item label={l('backupLabel')}>
        {backupFilePath ? (
          <Styled.Attached>
            <span>{basename(backupFilePath)}</span>
            <Button
              type="link"
              size="small"
              disabled={disabled}
              onClick={() => onBackupChange(undefined)}
            >
              {l('backupRemove')}
            </Button>
          </Styled.Attached>
        ) : (
          <Upload.Dragger
            fileList={undefined}
            accept=".backup"
            disabled={disabled}
            beforeUpload={file => {
              onBackupChange(file.path);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">{l('backupDragger')}</p>
          </Upload.Dragger>
        )}
      </Form.Item>
      {backupFilePath && (
        <Styled.Alert type="info" showIcon message={l('backupNotice')} />
      )}
    </>
  );
};

export default RestoreWalletForm;
