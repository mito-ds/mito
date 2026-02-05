/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import taglineStyles from './HomeTagline.module.css';
import { classNames } from '../../utils/classNames';

interface PillarItem {
  id: string;
  headline: string;
  description: string;
}

const PILLARS: PillarItem[] = [
  {
    id: 'private',
    headline: 'Private by design',
    description:
      'Mito runs 100% on your infrastructure. Bring your own API keys with Azure, LiteLLM, or any preferred LLM provider — no data ever leaves your systems.',
  },
  {
    id: 'jupyter',
    headline: 'Jupyter-native',
    description:
      'Purpose-built as a Jupyter extension, not bolted on. Mito understands notebook file formats, works with JupyterHub, and plays nicely with your existing extensions.',
  },
  {
    id: 'skill-level',
    headline: 'Built for every skill level',
    description:
      'From analysts automating Excel reports to ML engineers building models — Mito meets your whole team where they are with spreadsheet UIs and AI-powered code generation.',
  },
];

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={classNames(taglineStyles.chevron, { [taglineStyles.chevronOpen]: isOpen })}
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const HomeTagline = (): JSX.Element => {
  const [openId, setOpenId] = useState<string>('private');

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? '' : id));
  };

  return (
    <div className={taglineStyles.container}>
      <div className={taglineStyles.accordion}>
        {PILLARS.map((pillar, index) => {
          const isOpen = openId === pillar.id;
          return (
            <div
              key={pillar.id}
              className={classNames(taglineStyles.item, { [taglineStyles.itemOpen]: isOpen })}
            >
              <button
                type="button"
                className={taglineStyles.trigger}
                onClick={() => handleToggle(pillar.id)}
                aria-expanded={isOpen}
              >
                <span className={taglineStyles.number}>0{index + 1}</span>
                <span className={taglineStyles.headline}>{pillar.headline}</span>
                <ChevronIcon isOpen={isOpen} />
              </button>
              <div
                className={classNames(taglineStyles.panel, { [taglineStyles.panelOpen]: isOpen })}
                role="region"
              >
                <div className={taglineStyles.panelInner}>
                  <p className={taglineStyles.description}>{pillar.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomeTagline;
