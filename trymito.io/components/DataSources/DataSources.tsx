/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Image from 'next/image';
import dataSourcesStyles from './DataSources.module.css';

const dataSources = [
  { name: 'PostgreSQL', logo: '/data-sources/postgresql.svg' },
  { name: 'MySQL', logo: '/data-sources/mysql.svg' },
  { name: 'Microsoft SQL Server', logo: '/data-sources/sql-server.svg' },
  { name: 'Oracle', logo: '/data-sources/oracle.svg' },
  { name: 'Snowflake', logo: '/data-sources/snowflake.svg' },
  { name: 'BigQuery', logo: '/data-sources/bigquery.svg' },
  { name: 'Redshift', logo: '/data-sources/redshift.svg' },
  { name: 'MongoDB', logo: '/data-sources/mongodb.svg' },
  { name: 'SQLite', logo: '/data-sources/sqlite.svg' },
  { name: 'Databricks', logo: '/data-sources/databricks.svg' },
  { name: 'S3 / AWS', logo: '/data-sources/s3.svg' },
  { name: 'Excel / CSV', logo: '/data-sources/excel-csv.svg' },
];

const DataSources = (): JSX.Element => {
  return (
    <div className={dataSourcesStyles.container}>
      <div className={dataSourcesStyles.header}>
        <h2 className="gradient-heading">Connect to Your Data Sources</h2>
        <p>Mito works with the databases and data warehouses your team already uses.</p>
      </div>
      <div className={dataSourcesStyles.grid}>
        {dataSources.map((source) => (
          <div key={source.name} className={dataSourcesStyles.card}>
            <div className={dataSourcesStyles.logo}>
              <Image src={source.logo} alt={source.name} width={48} height={48} />
            </div>
            <span>{source.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataSources;
