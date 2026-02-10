/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import path from 'path';
import fs from 'fs';
import { IntegrationPageContent } from '../integrations-page-contents/types';

const INTEGRATIONS_CONTENTS_DIR = 'integrations-page-contents';

/**
 * Read all integration page JSON files and return typed content array.
 */
export function getIntegrationPageContentArray(): IntegrationPageContent[] {
  const dir = path.join(process.cwd(), INTEGRATIONS_CONTENTS_DIR);
  const fileNames = fs.readdirSync(dir);
  const jsonFileNames = fileNames.filter((fileName) => fileName.endsWith('.json'));
  const contents: IntegrationPageContent[] = jsonFileNames.map((fileName) => {
    const filePath = path.join(dir, fileName);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as IntegrationPageContent;
  });
  return contents;
}

/**
 * Resolve a slug path (e.g. ["claude-jupyter-notebook"]) to a single page content or null.
 */
export function getIntegrationPageBySlug(slug: string[]): IntegrationPageContent | null {
  if (!slug || slug.length === 0) return null;
  const segment = slug.join('/');
  const array = getIntegrationPageContentArray();
  const page = array.find((p) => p.slug === segment || p.slug === slug[0]);
  return page ?? null;
}
