/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  applyScenarioInjection,
  assertOutputButtons,
  buildOutputHostFixture,
  cleanupFixture,
  ExpectedButtons,
} from './outputButtonTestUtils';

describe('output overlay button visibility', () => {
  const cases: Array<{
    id: string;
    isDocumentMode: boolean;
    hostType: 'markdown' | 'codeOutput';
    hasGraph: boolean;
    isMitosheet: boolean;
    injectViewCode: boolean;
    injectComment: boolean;
    injectChartWizard: boolean;
    expected: ExpectedButtons;
  }> = [
    {
      id: 'D1',
      isDocumentMode: true,
      hostType: 'markdown',
      hasGraph: false,
      isMitosheet: false,
      injectViewCode: true,
      injectComment: true,
      injectChartWizard: false,
      expected: { viewCode: true, comment: true, chartWizard: false },
    },
    {
      id: 'D2',
      isDocumentMode: true,
      hostType: 'codeOutput',
      hasGraph: false,
      isMitosheet: false,
      injectViewCode: true,
      injectComment: true,
      injectChartWizard: false,
      expected: { viewCode: true, comment: true, chartWizard: false },
    },
    {
      id: 'D3',
      isDocumentMode: true,
      hostType: 'codeOutput',
      hasGraph: true,
      isMitosheet: false,
      injectViewCode: true,
      injectComment: true,
      injectChartWizard: true,
      expected: { viewCode: true, comment: true, chartWizard: true },
    },
    {
      id: 'N1',
      isDocumentMode: false,
      hostType: 'markdown',
      hasGraph: false,
      isMitosheet: false,
      injectViewCode: false,
      injectComment: false,
      injectChartWizard: false,
      expected: { viewCode: false, comment: false, chartWizard: false },
    },
    {
      id: 'N2',
      isDocumentMode: false,
      hostType: 'codeOutput',
      hasGraph: false,
      isMitosheet: false,
      injectViewCode: false,
      injectComment: false,
      injectChartWizard: false,
      expected: { viewCode: false, comment: false, chartWizard: false },
    },
    {
      id: 'N3',
      isDocumentMode: false,
      hostType: 'codeOutput',
      hasGraph: false,
      isMitosheet: true,
      injectViewCode: false,
      injectComment: true,
      injectChartWizard: false,
      expected: { viewCode: false, comment: false, chartWizard: false },
    },
    {
      id: 'N4',
      isDocumentMode: false,
      hostType: 'codeOutput',
      hasGraph: true,
      isMitosheet: false,
      injectViewCode: false,
      injectComment: true,
      injectChartWizard: true,
      expected: { viewCode: false, comment: true, chartWizard: true },
    },
    {
      id: 'N5',
      isDocumentMode: false,
      hostType: 'codeOutput',
      hasGraph: false,
      isMitosheet: false,
      injectViewCode: false,
      injectComment: true,
      injectChartWizard: false,
      expected: { viewCode: false, comment: true, chartWizard: false },
    },
  ];

  it.each(cases)(
    '$id',
    ({
      isDocumentMode,
      hostType,
      hasGraph,
      isMitosheet,
      injectViewCode,
      injectComment,
      injectChartWizard,
      expected,
    }) => {
      const fixture = buildOutputHostFixture({
        isDocumentMode,
        hostType,
        hasGraph,
        isMitosheet,
      });

      applyScenarioInjection(fixture, {
        injectViewCode,
        injectComment,
        injectChartWizard,
        isMitosheet,
        isDocumentMode,
      });

      assertOutputButtons(fixture.host, expected);
      cleanupFixture(fixture);
    }
  );
});
