import React from 'react';
import styles from './DetailsList.module.less';

interface Props {
  details: {
    label: string;
    value: React.ReactNode;
  }[];
}

const DetailsList: React.SFC<Props> = ({ details }) => {
  return (
    <table className={styles.details}>
      <tbody>
        {details.map(d => (
          <tr className={styles.row} key={d.label}>
            <td className={styles.label}>{d.label}</td>
            <td className={styles.value}>{d.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DetailsList;
