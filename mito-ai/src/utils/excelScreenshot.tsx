/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { executeScratchpadCode } from './scratchpadExecution';

export type ExcelScreenshotSheet = {
    name: string;
    base64Image: string;
}

export type ExcelScreenshotResult = {
    success: boolean;
    sheets: ExcelScreenshotSheet[];
    error?: string;
}

/**
 * Generates base64-encoded PNG screenshots of each worksheet in an Excel file.
 * Executes Python code silently in the kernel using openpyxl and matplotlib.
 *
 * @param notebookPanel - The notebook panel containing the active kernel
 * @param excelFilePath - Path to the Excel file to screenshot
 * @returns Promise resolving to a result with per-sheet base64 PNG images
 */
export async function takeExcelWorksheetScreenshots(
    notebookPanel: NotebookPanel,
    excelFilePath: string
): Promise<ExcelScreenshotResult> {
    // Escape the file path for safe inclusion in a Python string literal
    const escapedPath = excelFilePath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const code = `
import openpyxl as _scratch_openpyxl
import io as _scratch_io
import base64 as _scratch_base64
import json as _scratch_json
import matplotlib as _scratch_matplotlib
_scratch_matplotlib.use('Agg')
import matplotlib.pyplot as _scratch_plt

_scratch_wb = _scratch_openpyxl.load_workbook('${escapedPath}', data_only=True)
_scratch_images = {}
for _scratch_sheet_name in _scratch_wb.sheetnames:
    _scratch_ws = _scratch_wb[_scratch_sheet_name]
    _scratch_data = list(_scratch_ws.values)
    if not _scratch_data:
        continue
    _scratch_str_data = [[str(_scratch_cell) if _scratch_cell is not None else '' for _scratch_cell in _scratch_row] for _scratch_row in _scratch_data]
    _scratch_n_rows = len(_scratch_str_data)
    _scratch_n_cols = max(len(_scratch_row) for _scratch_row in _scratch_str_data) if _scratch_str_data else 0
    if _scratch_n_cols == 0:
        continue
    # Pad rows that are shorter than the max width
    _scratch_str_data = [_scratch_row + [''] * (_scratch_n_cols - len(_scratch_row)) for _scratch_row in _scratch_str_data]
    _scratch_fig_height = max(2, min(_scratch_n_rows * 0.35 + 1, 24))
    _scratch_fig_width = max(8, min(_scratch_n_cols * 1.6, 32))
    _scratch_fig, _scratch_ax = _scratch_plt.subplots(figsize=(_scratch_fig_width, _scratch_fig_height))
    _scratch_ax.axis('off')
    _scratch_body = _scratch_str_data[1:] if _scratch_n_rows > 1 else [[''] * _scratch_n_cols]
    _scratch_table = _scratch_ax.table(
        cellText=_scratch_body,
        colLabels=_scratch_str_data[0],
        loc='center',
        cellLoc='left'
    )
    _scratch_table.auto_set_font_size(False)
    _scratch_table.set_fontsize(8)
    _scratch_table.auto_set_column_width(col=list(range(_scratch_n_cols)))
    _scratch_fig.tight_layout()
    _scratch_buf = _scratch_io.BytesIO()
    _scratch_fig.savefig(_scratch_buf, format='png', bbox_inches='tight', dpi=100)
    _scratch_buf.seek(0)
    _scratch_images[_scratch_sheet_name] = _scratch_base64.b64encode(_scratch_buf.read()).decode('utf-8')
    _scratch_plt.close(_scratch_fig)
print(_scratch_json.dumps(_scratch_images))
`;

    const result = await executeScratchpadCode(notebookPanel, code);

    if (!result.success) {
        return {
            success: false,
            sheets: [],
            error: result.error || result.stderr || 'Screenshot generation failed'
        };
    }

    if (!result.stdout) {
        return { success: false, sheets: [], error: 'No output from screenshot code' };
    }

    try {
        const screenshots: Record<string, string> = JSON.parse(result.stdout);
        const sheets = Object.entries(screenshots).map(([name, base64Image]) => ({
            name,
            base64Image
        }));
        return { success: true, sheets };
    } catch {
        return { success: false, sheets: [], error: 'Failed to parse screenshot output' };
    }
}
