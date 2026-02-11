/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
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

const HALF = Math.ceil(INTEGRATIONS.length / 2);
const CAROUSEL_1_ITEMS = INTEGRATIONS.slice(0, HALF);
const CAROUSEL_2_ITEMS = INTEGRATIONS.slice(HALF);

/** Max vertical dip (px) at viewport center. Arc is viewport-relative so it stays visible while scrolling. */
const ARC_DEPTH_PX = 40;
/** Distance from viewport center (px) at which the arc reaches zero. */
const ARC_HALF_WIDTH_PX = 420;

const DataSources = (): JSX.Element => {
  const carousel1Items = [...CAROUSEL_1_ITEMS, ...CAROUSEL_1_ITEMS];
  const carousel2Items = [...CAROUSEL_2_ITEMS, ...CAROUSEL_2_ITEMS];
  const track1Ref = React.useRef<HTMLDivElement>(null);
  const track2Ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let raf = 0;
    const updateArc = (): void => {
      const vwCenter = window.innerWidth / 2;
      [track1Ref.current, track2Ref.current].forEach((trackEl) => {
        if (!trackEl) return;
        const cards = trackEl.querySelectorAll<HTMLElement>('[data-arc-card]');
        cards.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const dist = Math.abs(centerX - vwCenter);
          const t = Math.min(1, dist / ARC_HALF_WIDTH_PX);
          const y = ARC_DEPTH_PX * (1 - t * t);
          el.style.transform = y ? `translateY(${y}px)` : '';
        });
      });
      raf = requestAnimationFrame(updateArc);
    };
    updateArc();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={dataSourceStyles.container}>
      <header className={dataSourceStyles.header}>
        <h2 className={dataSourceStyles.heading}>Connect to your stack</h2>
        <p className={dataSourceStyles.subheading}>
          Mito works with the databases and data warehouses your team already uses.
        </p>
      </header>

      <div className={dataSourceStyles.carouselsFullBleedWrap}>
        <div className={dataSourceStyles.carouselsFullBleed}>
        <div className={dataSourceStyles.carouselWrap} aria-hidden="true">
          <div
            ref={track1Ref}
            className={`${dataSourceStyles.carouselTrack} ${dataSourceStyles.carouselTrackRightToLeft}`}
          >
            {carousel1Items.map(({ name, icon }, i) => (
              <div
                key={`c1-${i}-${name}`}
                className={dataSourceStyles.iconCardLogoOnly}
                data-arc-card
              >
                <div className={dataSourceStyles.iconCardInner}>
                  <div className={dataSourceStyles.iconWrapper}>
                    <Image src={icon} alt={name} width={48} height={48} unoptimized />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={dataSourceStyles.carouselWrap} aria-hidden="true">
          <div
            ref={track2Ref}
            className={`${dataSourceStyles.carouselTrack} ${dataSourceStyles.carouselTrackLeftToRight}`}
          >
            {carousel2Items.map(({ name, icon }, i) => (
              <div
                key={`c2-${i}-${name}`}
                className={dataSourceStyles.iconCardLogoOnly}
                data-arc-card
              >
                <div className={dataSourceStyles.iconCardInner}>
                  <div className={dataSourceStyles.iconWrapper}>
                    <Image src={icon} alt={name} width={48} height={48} unoptimized />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DataSources;
