/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookViewMode } from '../../Extensions/NotebookViewMode/NotebookViewModePlugin';
import { shouldCollapseCellInputForChartWizard } from '../../Extensions/ChartWizard/ChartWizardPlugin';

function mockViewMode(mode: ReturnType<INotebookViewMode['getMode']>): INotebookViewMode {
    return { getMode: () => mode } as INotebookViewMode;
}

describe('shouldCollapseCellInputForChartWizard', () => {
    it('does not collapse cell input in Document mode', () => {
        expect(shouldCollapseCellInputForChartWizard(mockViewMode('Document'))).toBe(false);
    });

    it('collapses cell input in Notebook mode', () => {
        expect(shouldCollapseCellInputForChartWizard(mockViewMode('Notebook'))).toBe(true);
    });

    it('collapses cell input in App mode', () => {
        expect(shouldCollapseCellInputForChartWizard(mockViewMode('App'))).toBe(true);
    });

    it('collapses cell input when view mode service is unavailable', () => {
        expect(shouldCollapseCellInputForChartWizard(null)).toBe(true);
        expect(shouldCollapseCellInputForChartWizard(undefined)).toBe(true);
    });
});
