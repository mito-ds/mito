/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { flushSync } from 'react-dom';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import CodeIcon from '../../icons/CodeIcon';
import MagicWand from '../../icons/MagicWand';
import {
  hasOutputActionSlot,
  mountOutputAction,
  OUTPUT_ACTIONS_TOOLBAR_CLASS,
} from '../../Extensions/OutputActions/outputActionsToolbar';

export { hasOutputActionSlot, OUTPUT_ACTIONS_TOOLBAR_CLASS };
import {
  mountOutputCommentButtonOnHost,
  shouldMountOutputCommentButton,
} from '../../Extensions/Comments/CommentsPlugin';
import TextAndIconButton from '../../components/TextAndIconButton';

export const DOCUMENT_MODE_CLASS = 'jp-mod-mito-document-mode';

export type HostType = 'markdown' | 'codeOutput';

export interface OutputHostFixture {
  notebookRoot: HTMLElement;
  host: HTMLElement;
}

export interface ExpectedButtons {
  viewCode: boolean;
  comment: boolean;
  chartWizard: boolean;
}

export function buildOutputHostFixture(options: {
  isDocumentMode: boolean;
  hostType: HostType;
  hasGraph?: boolean;
  isMitosheet?: boolean;
}): OutputHostFixture {
  const notebookRoot = document.createElement('div');
  notebookRoot.className = 'jp-Notebook';
  if (options.isDocumentMode) {
    notebookRoot.classList.add(DOCUMENT_MODE_CLASS);
  }

  let host: HTMLElement;
  if (options.hostType === 'markdown') {
    host = document.createElement('div');
    host.className = 'jp-MarkdownOutput';
  } else {
    host = document.createElement('div');
    host.className = 'jp-Cell-outputWrapper';
    if (options.isMitosheet) {
      const mito = document.createElement('div');
      mito.className = 'mito-container';
      host.appendChild(mito);
    }
    if (options.hasGraph) {
      const textOut = document.createElement('div');
      textOut.className = 'jp-OutputArea-output';
      textOut.textContent = 'Hello World';
      host.appendChild(textOut);

      const chartMarker = document.createElement('div');
      chartMarker.className = 'chart-wizard-output-container';
      host.appendChild(chartMarker);
    }
  }

  notebookRoot.appendChild(host);
  document.body.appendChild(notebookRoot);
  return { notebookRoot, host };
}

export function cleanupFixture(fixture: OutputHostFixture): void {
  fixture.notebookRoot.remove();
}

export function createMockAppAndTracker(): {
  app: JupyterFrontEnd;
  notebookTracker: INotebookTracker;
} {
  return {
    app: { commands: { execute: jest.fn() } } as unknown as JupyterFrontEnd,
    notebookTracker: { currentWidget: null } as unknown as INotebookTracker,
  };
}

export function mountViewCodeOnHost(host: HTMLElement): void {
  mountOutputAction(
    host,
    'viewCode',
    <TextAndIconButton
      icon={CodeIcon}
      text="View code"
      title="View code"
      onClick={() => undefined}
      variant="purple"
      width="fit-contents"
      iconPosition="left"
    />
  );
}

export function mountChartWizardOnHost(host: HTMLElement): void {
  mountOutputAction(
    host,
    'chartWizard',
    <TextAndIconButton
      icon={MagicWand}
      text="Chart Wizard"
      title="Chart Wizard"
      onClick={() => undefined}
      variant="purple"
      width="fit-contents"
      iconPosition="left"
    />
  );
}

export function applyScenarioInjection(
  fixture: OutputHostFixture,
  options: {
    injectViewCode: boolean;
    injectComment: boolean;
    injectChartWizard: boolean;
    isMitosheet: boolean;
    isDocumentMode: boolean;
    cellId?: string;
  }
): void {
  const { app, notebookTracker } = createMockAppAndTracker();
  const cellId = options.cellId ?? 'test-cell-id';

  flushSync(() => {
    if (options.injectViewCode) {
      mountViewCodeOnHost(fixture.host);
    }

    if (
      options.injectComment &&
      shouldMountOutputCommentButton(options.isDocumentMode, options.isMitosheet)
    ) {
      mountOutputCommentButtonOnHost(fixture.host, cellId, app, notebookTracker);
    }

    if (options.injectChartWizard) {
      mountChartWizardOnHost(fixture.host);
    }
  });
}

export function assertOutputButtons(
  host: HTMLElement,
  expected: ExpectedButtons
): void {
  expect(hasOutputActionSlot(host, 'viewCode')).toBe(expected.viewCode);
  expect(hasOutputActionSlot(host, 'comment')).toBe(expected.comment);
  expect(hasOutputActionSlot(host, 'chartWizard')).toBe(expected.chartWizard);
}
