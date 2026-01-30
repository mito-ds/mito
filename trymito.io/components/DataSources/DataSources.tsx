/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import Image from 'next/image';
import styles from './DataSources.module.css';

const DATA_SOURCES: { name: string; icon: string }[] = [
  { name: 'PostgreSQL', icon: '/data-sources/postgresql.svg' },
  { name: 'MySQL', icon: '/data-sources/mysql.svg' },
  { name: 'SQL Server', icon: '/data-sources/sqlserver.svg' },
  { name: 'Oracle', icon: '/data-sources/oracle.svg' },
  { name: 'Snowflake', icon: '/data-sources/snowflake.svg' },
  { name: 'BigQuery', icon: '/data-sources/bigquery.svg' },
  { name: 'Redshift', icon: '/data-sources/redshift.svg' },
  { name: 'MongoDB', icon: '/data-sources/mongodb.svg' },
  { name: 'SQLite', icon: '/data-sources/sqlite.svg' },
  { name: 'Databricks', icon: '/data-sources/databricks.svg' },
  { name: 'S3 / AWS', icon: '/data-sources/aws.svg' },
  { name: 'Excel / CSV', icon: '/data-sources/excel-csv.svg' },
];

const DataSources = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Connect to Your Data Sources</h2>
      <p className={styles.subheading}>
        Mito works with the databases and data warehouses your team already uses.
      </p>
      <div className={styles.grid}>
        {DATA_SOURCES.map(({ name, icon }) => (
          <div key={name} className={styles.iconCard}>
            <div className={styles.iconWrapper}>
              <Image src={icon} alt={name} width={48} height={48} unoptimized />
            </div>
            <span className={styles.label}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataSources;
