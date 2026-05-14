/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { TableOfContents } from '@jupyterlab/toc';
import { INotebookViewMode, NotebookViewMode } from '../NotebookViewMode/NotebookViewModePlugin';

interface IDocumentTableOfContentsProps {
  model: TableOfContents.Model;
  viewMode: INotebookViewMode;
}

const DocumentTableOfContents: React.FC<IDocumentTableOfContentsProps> = ({
  model,
  viewMode
}) => {
  const [headings, setHeadings] = useState<TableOfContents.IHeading[]>(
    model.headings
  );
  const [activeHeading, setActiveHeading] =
    useState<TableOfContents.IHeading | null>(model.activeHeading);
  const [mode, setMode] = useState<NotebookViewMode>(viewMode.getMode());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const onHeadingsChanged = (): void => {
      setHeadings([...model.headings]);
    };
    const onActiveHeadingChanged = (
      _: TableOfContents.Model,
      h: TableOfContents.IHeading | null
    ): void => {
      setActiveHeading(h);
    };
    const onModeChanged = (_: INotebookViewMode, m: NotebookViewMode): void => {
      setMode(m);
    };

    model.headingsChanged.connect(onHeadingsChanged);
    model.activeHeadingChanged.connect(onActiveHeadingChanged);
    viewMode.modeChanged.connect(onModeChanged);

    return () => {
      model.headingsChanged.disconnect(onHeadingsChanged);
      model.activeHeadingChanged.disconnect(onActiveHeadingChanged);
      viewMode.modeChanged.disconnect(onModeChanged);
    };
  }, [model, viewMode]);

  if (mode !== 'Document' || headings.length === 0) {
    return null;
  }

  const onItemClick = (heading: TableOfContents.IHeading): void => {
    model.setActiveHeading(heading);
  };

  const isActive = (heading: TableOfContents.IHeading): boolean => {
    if (!activeHeading) {
      return false;
    }
    return (
      activeHeading.text === heading.text &&
      activeHeading.level === heading.level
    );
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
