/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  applyScenarioInjection,
  buildOutputHostFixture,
  cleanupFixture,
  OUTPUT_ACTIONS_TOOLBAR_CLASS,
} from './outputButtonTestUtils';

const TOOLBAR_TOP_OFFSET_PX = 8;
const TOOLBAR_RIGHT_OFFSET_PX = 8;

describe('output overlay button layout', () => {
  it('L1: single toolbar on wrapper; buttons not under chart node', () => {
    const fixture = buildOutputHostFixture({
      isDocumentMode: true,
      hostType: 'codeOutput',
      hasGraph: true,
    });

    applyScenarioInjection(fixture, {
      injectViewCode: true,
      injectComment: true,
      injectChartWizard: true,
      isMitosheet: false,
      isDocumentMode: true,
    });

    const toolbars = fixture.host.querySelectorAll(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`);
    expect(toolbars).toHaveLength(1);

    const chartMarker = fixture.host.querySelector('.chart-wizard-output-container');
    expect(chartMarker?.querySelector('.mito-output-action-slot-chartWizard')).toBeNull();

    for (const slot of ['viewCode', 'chartWizard', 'comment']) {
      const el = fixture.host.querySelector(`.mito-output-action-slot-${slot}`);
      expect(el?.closest(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`)).toBe(toolbars[0]);
    }

    cleanupFixture(fixture);
  });

  it('L2: toolbar anchored to wrapper top-right', () => {
    const fixture = buildOutputHostFixture({
      isDocumentMode: true,
      hostType: 'codeOutput',
      hasGraph: true,
    });

    applyScenarioInjection(fixture, {
      injectViewCode: true,
      injectComment: true,
      injectChartWizard: true,
      isMitosheet: false,
      isDocumentMode: true,
    });

    const toolbar = fixture.host.querySelector(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`) as HTMLElement;
    const toolbarStyle = window.getComputedStyle(toolbar);

    expect(toolbarStyle.position).toBe('absolute');
    expect(toolbarStyle.top).toBe(`${TOOLBAR_TOP_OFFSET_PX}px`);
    expect(toolbarStyle.right).toBe(`${TOOLBAR_RIGHT_OFFSET_PX}px`);

    cleanupFixture(fixture);
  });

  it('L3: equal flex gap between adjacent toolbar buttons', () => {
    const fixture = buildOutputHostFixture({
      isDocumentMode: true,
      hostType: 'codeOutput',
      hasGraph: true,
    });

    applyScenarioInjection(fixture, {
      injectViewCode: true,
      injectComment: true,
      injectChartWizard: true,
      isMitosheet: false,
      isDocumentMode: true,
    });

    const toolbar = fixture.host.querySelector(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`) as HTMLElement;
    expect(window.getComputedStyle(toolbar).gap).toBe('8px');

    const slots = toolbar.querySelectorAll('.mito-output-action-slot');
    expect(slots.length).toBe(3);

    cleanupFixture(fixture);
  });

  it('L4: notebook graph — toolbar at wrapper top-right', () => {
    const fixture = buildOutputHostFixture({
      isDocumentMode: false,
      hostType: 'codeOutput',
      hasGraph: true,
    });

    applyScenarioInjection(fixture, {
      injectViewCode: false,
      injectComment: true,
      injectChartWizard: true,
      isMitosheet: false,
      isDocumentMode: false,
    });

    const toolbar = fixture.host.querySelector(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`) as HTMLElement;
    const toolbarStyle = window.getComputedStyle(toolbar);

    expect(toolbarStyle.right).toBe(`${TOOLBAR_RIGHT_OFFSET_PX}px`);
    expect(toolbarStyle.top).toBe(`${TOOLBAR_TOP_OFFSET_PX}px`);

    cleanupFixture(fixture);
  });

  it('L5: text above chart — toolbar stays on wrapper not chart node', () => {
    const fixture = buildOutputHostFixture({
      isDocumentMode: false,
      hostType: 'codeOutput',
      hasGraph: true,
    });

    applyScenarioInjection(fixture, {
      injectViewCode: false,
      injectComment: true,
      injectChartWizard: true,
      isMitosheet: false,
      isDocumentMode: false,
    });

    const chartMarker = fixture.host.querySelector('.chart-wizard-output-container') as HTMLElement;
    const toolbar = fixture.host.querySelector(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`) as HTMLElement;

    expect(fixture.host.contains(toolbar)).toBe(true);
    expect(chartMarker.contains(toolbar)).toBe(false);
    expect(fixture.host.firstElementChild?.classList.contains('jp-OutputArea-output')).toBe(true);

    cleanupFixture(fixture);
  });
});
