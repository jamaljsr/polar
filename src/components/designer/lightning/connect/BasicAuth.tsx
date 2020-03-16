import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  password: string;
}

const BasicAuth: React.FC<Props> = ({ password }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.connect.BasicAuth');

  const base64pass = Buffer.from(`:${password}`).toString('base64');
  const auth = `Basic ${base64pass}`;

  const details: DetailValues = [
    [l('username'), '', '<blank>'],
    [l('password'), password, password],
    [l('base64auth'), auth, auth],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value as string} text={text} />,
  }));

  return <DetailsList details={details} oneCol />;
};

export default BasicAuth;
