/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import dataSourceStyles from './DataSources.module.css';

export type DataSourceCategory = 'all' | 'warehouses' | 'databases' | 'files' | 'version-control';

interface Integration {
  name: string;
  icon: string;
  category: DataSourceCategory;
  categoryLabel: string;
  builtIn?: boolean;
}

const INTEGRATIONS: Integration[] = [
  /* Data warehouses & lakes */
  { name: 'BigQuery', icon: '/data-sources/bigquery.svg', category: 'warehouses', categoryLabel: 'Data warehouse' },
  { name: 'Snowflake', icon: '/data-sources/snowflake.svg', category: 'warehouses', categoryLabel: 'Data warehouse' },
  { name: 'Redshift', icon: '/data-sources/redshift.svg', category: 'warehouses', categoryLabel: 'Data warehouse' },
  { name: 'Amazon Athena', icon: '/data-sources/athena.svg', category: 'warehouses', categoryLabel: 'Data warehouse'},
  { name: 'ClickHouse', icon: '/data-sources/clickhouse.svg', category: 'warehouses', categoryLabel: 'Data warehouse' },
  { name: 'Trino', icon: '/data-sources/trino.svg', category: 'warehouses', categoryLabel: 'SQL query engine' },
  { name: 'Dremio', icon: '/data-sources/dremio.svg', category: 'warehouses', categoryLabel: 'SQL query engine' },
  { name: 'Databricks', icon: '/data-sources/databricks.svg', category: 'warehouses', categoryLabel: 'Data lakehouse' },
  /* Databases */
  { name: 'PostgreSQL', icon: '/data-sources/postgresql.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'MySQL', icon: '/data-sources/mysql.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'SQL Server', icon: '/data-sources/sqlserver.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'Oracle', icon: '/data-sources/oracle.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'MongoDB', icon: '/data-sources/mongodb.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'SQLite', icon: '/data-sources/sqlite.png', category: 'databases', categoryLabel: 'Database' },
  { name: 'Supabase', icon: '/data-sources/supabase.png', category: 'databases', categoryLabel: 'Database' },
  { name: 'Google AlloyDB', icon: '/data-sources/alloydb.svg', category: 'databases', categoryLabel: 'Database'},
  { name: 'GC SQL', icon: '/data-sources/cloud-sql.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'Google Spanner', icon: '/data-sources/spanner.svg', category: 'databases', categoryLabel: 'Database' },
  /* Files */
  { name: 'Excel', icon: '/data-sources/excel.png', category: 'files', categoryLabel: 'Files' },
  { name: 'CSV', icon: '/data-sources/excel.png', category: 'files', categoryLabel: 'Files' },
  { name: 'Word', icon: '/data-sources/word.png', category: 'files', categoryLabel: 'Files' },
  { name: 'PowerPoint', icon: '/data-sources/powerpoint.png', category: 'files', categoryLabel: 'Files' },
  { name: 'Amazon S3', icon: '/data-sources/aws.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Google Drive', icon: '/data-sources/drive.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'GC Storage', icon: '/data-sources/gcs.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Dropbox', icon: '/data-sources/dropbox.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'OneDrive', icon: '/data-sources/onedrive.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Azure Blob', icon: '/data-sources/azure-blob-storage.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Google Sheets', icon: '/data-sources/google-sheets.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Box', icon: '/data-sources/box.svg', category: 'files', categoryLabel: 'Files' },
  /* Version control */
  { name: 'GitHub', icon: '/data-sources/github.svg', category: 'version-control', categoryLabel: 'Version control' },
  { name: 'GitLab', icon: '/data-sources/gitlab.svg', category: 'version-control', categoryLabel: 'Version control' },
];

const SECTIONS: { id: DataSourceCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'warehouses', label: 'Data warehouses' },
  { id: 'databases', label: 'Databases' },
  { id: 'files', label: 'Files' },
  { id: 'version-control', label: 'Version control' },
];

const DataSources = (): JSX.Element => {
  const [activeSection, setActiveSection] = useState<DataSourceCategory>('all');

  return (
    <div className={dataSourceStyles.container}>
      <header className={dataSourceStyles.header}>
        <h2 className={dataSourceStyles.heading}>Connect to your stack</h2>
        <p className={dataSourceStyles.subheading}>
          Mito works with the databases and data warehouses your team already uses.
        </p>
      </header>

      <div className={dataSourceStyles.layout}>
        <nav className={dataSourceStyles.nav} role="tablist" aria-label="Integration categories">
            {SECTIONS.map(({ id, label }) => (
              <div
                key={id}
                role="tab"
                aria-selected={activeSection === id}
                aria-controls="integrations-panel"
                id={`tab-${id}`}
                className={activeSection === id ? dataSourceStyles.navItemActive : dataSourceStyles.navItem}
                onClick={() => setActiveSection(id)}
              >
                {label}
              </div>
            ))}
        </nav>

        <div
          id="integrations-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeSection}`}
          className={dataSourceStyles.gridWrap}
          data-active={activeSection}
        >
          <div className={dataSourceStyles.grid}>
            {INTEGRATIONS.map(({ name, icon, category, categoryLabel, builtIn }) => (
              <div
                key={name}
                className={dataSourceStyles.iconCard}
                data-category={category}
              >
                <div className={dataSourceStyles.iconCardInner}>
                  {builtIn && <span className={dataSourceStyles.builtIn}>Built-in</span>}
                  <div className={dataSourceStyles.iconWrapper}>
                    <Image src={icon} alt={name} width={48} height={48} unoptimized />
                  </div>
                  <div className={dataSourceStyles.labelContainer}>
                    <span className={dataSourceStyles.label}>{name}</span>
                    <span className={dataSourceStyles.categoryLabel}>{categoryLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSources;
