/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { TableOfContents } from '@jupyterlab/toc';
import { INotebookHeading } from '@jupyterlab/notebook';
import { NotebookPanel } from '@jupyterlab/notebook';
import { INotebookViewMode, NotebookViewMode } from '../NotebookViewMode/NotebookViewModePlugin';

interface IDocumentTableOfContentsProps {
  model: TableOfContents.Model;
  viewMode: INotebookViewMode;
  panel: NotebookPanel;
}

// The active heading is the last heading whose cell top has scrolled
// past this offset from the top of the notebook scroll container.
const ACTIVE_HEADING_OFFSET_PX = 100;

const computeActiveHeadingFromScroll = (
  headings: TableOfContents.IHeading[],
  scrollContainer: HTMLElement
): TableOfContents.IHeading | null => {
  if (headings.length === 0) {
    return null;
  }
  const threshold =
    scrollContainer.getBoundingClientRect().top + ACTIVE_HEADING_OFFSET_PX;

  let active: TableOfContents.IHeading | null = null;
  for (const heading of headings) {
    const cell = (heading as INotebookHeading).cellRef;
    const cellNode = cell?.node;
    if (!cellNode || !document.body.contains(cellNode)) {
      continue;
    }
    const rect = cellNode.getBoundingClientRect();
    if (rect.top <= threshold) {
      active = heading;
    }
  }
  return active ?? headings[0] ?? null;
};

const DocumentTableOfContents: React.FC<IDocumentTableOfContentsProps> = ({
  model,
  viewMode,
  panel
}) => {
  const [headings, setHeadings] = useState<TableOfContents.IHeading[]>(
    model.headings
  );
  const [activeHeading, setActiveHeading] =
    useState<TableOfContents.IHeading | null>(null);
  const [mode, setMode] = useState<NotebookViewMode>(viewMode.getMode());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const onHeadingsChanged = (): void => {
      setHeadings([...model.headings]);
    };
    const onModeChanged = (_: INotebookViewMode, m: NotebookViewMode): void => {
      setMode(m);
    };

    model.headingsChanged.connect(onHeadingsChanged);
    viewMode.modeChanged.connect(onModeChanged);

    return () => {
      model.headingsChanged.disconnect(onHeadingsChanged);
      viewMode.modeChanged.disconnect(onModeChanged);
    };
  }, [model, viewMode]);

  useEffect(() => {
    const scrollContainer = panel.content.outerNode;
    let rafId: number | null = null;

    const recompute = (): void => {
      rafId = null;
      setActiveHeading(
        computeActiveHeadingFromScroll(model.headings, scrollContainer)
      );
    };

    const onScroll = (): void => {
      if (rafId !== null) {
        return;
      }
      rafId = requestAnimationFrame(recompute);
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    scrollContainer.addEventListener('scrollend', onScroll, { passive: true });
    model.headingsChanged.connect(recompute);
    recompute();

    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
      scrollContainer.removeEventListener('scrollend', onScroll);
      model.headingsChanged.disconnect(recompute);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [panel, model]);

  if (mode !== 'Document' || headings.length === 0) {
    return null;
  }

  const onItemClick = (heading: TableOfContents.IHeading): void => {
    model.setActiveHeading(heading);
  };

  const isActive = (heading: TableOfContents.IHeading): boolean => {
    return activeHeading === heading;
  };

  return (
    <div
      className={`mito-toc-container${isHovered ? ' mito-toc-hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mito-toc-indicator" aria-hidden="true">
        {headings.map((heading, idx) => (
          <div
            key={`line-${idx}`}
            className={`mito-toc-line mito-toc-line-h${heading.level}${
              isActive(heading) ? ' mito-toc-line-active' : ''
            }`}
            data-level={heading.level}
          />
        ))}
      </div>
      <div className="mito-toc-panel" role="navigation" aria-label="Table of contents">
        {headings.map((heading, idx) => (
          <button
            key={`item-${idx}`}
            type="button"
            className={`mito-toc-item${
              isActive(heading) ? ' mito-toc-item-active' : ''
            }`}
            data-level={heading.level}
            onClick={() => onItemClick(heading)}
            title={heading.text}
          >
            {heading.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DocumentTableOfContents;
