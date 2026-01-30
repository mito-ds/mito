/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './DataSources.module.css';

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
  { name: 'BigQuery', icon: '/data-sources/bigquery.svg', category: 'warehouses', categoryLabel: 'Data warehouse', builtIn: true },
  { name: 'Snowflake', icon: '/data-sources/snowflake.svg', category: 'warehouses', categoryLabel: 'Data warehouse', builtIn: true },
  { name: 'Redshift', icon: '/data-sources/redshift.svg', category: 'warehouses', categoryLabel: 'Data warehouse', builtIn: true },
  { name: 'Amazon Athena', icon: '/data-sources/athena.svg', category: 'warehouses', categoryLabel: 'Data warehouse', builtIn: true },
  { name: 'ClickHouse', icon: '/data-sources/clickhouse.svg', category: 'warehouses', categoryLabel: 'Data warehouse', builtIn: true },
  { name: 'Trino', icon: '/data-sources/trino.svg', category: 'warehouses', categoryLabel: 'SQL query engine', builtIn: true },
  { name: 'Dremio', icon: '/data-sources/dremio.svg', category: 'warehouses', categoryLabel: 'SQL query engine', builtIn: true },
  { name: 'Databricks', icon: '/data-sources/databricks.svg', category: 'warehouses', categoryLabel: 'Data lakehouse', builtIn: true },
  /* Databases */
  { name: 'PostgreSQL', icon: '/data-sources/postgresql.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  { name: 'MySQL', icon: '/data-sources/mysql.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  { name: 'SQL Server', icon: '/data-sources/sqlserver.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  { name: 'Oracle', icon: '/data-sources/oracle.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'MongoDB', icon: '/data-sources/mongodb.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  { name: 'SQLite', icon: '/data-sources/sqlite.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'Supabase', icon: '/data-sources/supabase.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'InfluxDB', icon: '/data-sources/influxdb.svg', category: 'databases', categoryLabel: 'Database' },
  { name: 'Google AlloyDB', icon: '/data-sources/alloydb.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  { name: 'Google Cloud SQL', icon: '/data-sources/cloud-sql.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  { name: 'Google Spanner', icon: '/data-sources/spanner.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  { name: 'Materialize', icon: '/data-sources/materialize.svg', category: 'databases', categoryLabel: 'Database', builtIn: true },
  /* Files */
  { name: 'Amazon S3', icon: '/data-sources/aws.svg', category: 'files', categoryLabel: 'Files', builtIn: true },
  { name: 'Google Drive', icon: '/data-sources/drive.svg', category: 'files', categoryLabel: 'Files', builtIn: true },
  { name: 'Google Cloud Storage', icon: '/data-sources/gcs.svg', category: 'files', categoryLabel: 'Files', builtIn: true },
  { name: 'Dropbox', icon: '/data-sources/dropbox.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Microsoft OneDrive', icon: '/data-sources/onedrive.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Azure Blob Storage', icon: '/data-sources/azure-blob-storage.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Google Sheets', icon: '/data-sources/google-sheets.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Box', icon: '/data-sources/box.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Excel', icon: '/data-sources/excel.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'CSV', icon: '/data-sources/csv.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'Word', icon: '/data-sources/word.svg', category: 'files', categoryLabel: 'Files' },
  { name: 'PowerPoint', icon: '/data-sources/powerpoint.svg', category: 'files', categoryLabel: 'Files' },
  /* Version control */
  { name: 'GitHub', icon: '/data-sources/github.svg', category: 'version-control', categoryLabel: 'Version control', builtIn: true },
  { name: 'GitLab', icon: '/data-sources/gitlab.svg', category: 'version-control', categoryLabel: 'Version control' },
];

const SECTIONS: { id: DataSourceCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'warehouses', label: 'Data warehouses & lakes' },
  { id: 'databases', label: 'Databases' },
  { id: 'files', label: 'Files' },
  { id: 'version-control', label: 'Version control' },
];

const DataSources = (): JSX.Element => {
  const [activeSection, setActiveSection] = useState<DataSourceCategory>('all');

  const filtered =
    activeSection === 'all'
      ? INTEGRATIONS
      : INTEGRATIONS.filter((i) => i.category === activeSection);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Connect to your stack</h2>
      <p className={styles.subheading}>
        Mito works with any programming language, framework, and database. Explore our built-in integrations and connection guides.
      </p>

      <div className={styles.layout}>
        <nav className={styles.nav} role="tablist" aria-label="Integration categories">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeSection === id}
              aria-controls="integrations-panel"
              id={`tab-${id}`}
              className={activeSection === id ? styles.navItemActive : styles.navItem}
              onClick={() => setActiveSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div
          id="integrations-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeSection}`}
          className={styles.gridWrap}
        >
          <div className={styles.grid}>
            {filtered.map(({ name, icon, categoryLabel, builtIn }) => (
              <div key={name} className={styles.iconCard}>
                <div className={styles.iconCardInner}>
                  {builtIn && <span className={styles.builtIn}>Built-in</span>}
                  <div className={styles.iconWrapper}>
                    <Image src={icon} alt={name} width={48} height={48} unoptimized />
                  </div>
                  <span className={styles.label}>{name}</span>
                  <span className={styles.categoryLabel}>{categoryLabel}</span>
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
