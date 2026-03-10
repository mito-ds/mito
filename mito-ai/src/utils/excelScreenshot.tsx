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

def _scratch_argb_to_rgb(argb_str):
    """Convert an 8-char ARGB (or 6-char RGB) hex string to an (r, g, b) float tuple.
    Returns None for transparent ('00000000') or invalid values."""
    if not argb_str or len(argb_str) not in (6, 8):
        return None
    hex_str = argb_str[-6:]  # strip leading alpha byte if present
    if hex_str == '000000' and len(argb_str) == 8 and argb_str[:2] == '00':
        return None  # fully transparent
    try:
        return (int(hex_str[0:2], 16) / 255.0,
                int(hex_str[2:4], 16) / 255.0,
                int(hex_str[4:6], 16) / 255.0)
    except ValueError:
        return None

def _scratch_get_bg(cell):
    """Return the cell's solid fill colour as an RGB tuple, or None."""
    try:
        fill = cell.fill
        if fill and fill.fill_type == 'solid':
            c = fill.fgColor
            if c.type == 'rgb' and c.rgb not in ('00000000', ''):
                return _scratch_argb_to_rgb(c.rgb)
    except Exception:
        pass
    return None

def _scratch_get_fg(cell):
    """Return the cell's font colour as an RGB tuple, or None."""
    try:
        font = cell.font
        if font and font.color:
            c = font.color
            if c.type == 'rgb' and c.rgb not in ('00000000', ''):
                return _scratch_argb_to_rgb(c.rgb)
    except Exception:
        pass
    return None

_scratch_wb = _scratch_openpyxl.load_workbook('${escapedPath}', data_only=True)
_scratch_images = {}

for _scratch_sheet_name in _scratch_wb.sheetnames:
    _scratch_ws = _scratch_wb[_scratch_sheet_name]
    _scratch_rows = list(_scratch_ws.iter_rows())
    if not _scratch_rows:
        continue
    _scratch_n_rows = len(_scratch_rows)
    _scratch_n_cols = max((len(r) for r in _scratch_rows), default=0)
    if _scratch_n_cols == 0:
        continue

    _scratch_cell_text, _scratch_bg_colors, _scratch_fg_colors, _scratch_bold = [], [], [], []
    for _scratch_row in _scratch_rows:
        _t, _b, _f, _bold = [], [], [], []
        for _scratch_cell in _scratch_row:
            v = _scratch_cell.value
            _t.append(str(v) if v is not None else '')
            _b.append(_scratch_get_bg(_scratch_cell))
            _f.append(_scratch_get_fg(_scratch_cell))
            try:
                _bold.append(bool(_scratch_cell.font and _scratch_cell.font.bold))
            except Exception:
                _bold.append(False)
        # Pad short rows to full width
        pad = _scratch_n_cols - len(_t)
        _scratch_cell_text.append(_t + [''] * pad)
        _scratch_bg_colors.append(_b + [None] * pad)
        _scratch_fg_colors.append(_f + [None] * pad)
        _scratch_bold.append(_bold + [False] * pad)

    _scratch_fig_h = max(2, min(_scratch_n_rows * 0.35, 24))
    _scratch_fig_w = max(8, min(_scratch_n_cols * 1.6, 32))
    _scratch_fig, _scratch_ax = _scratch_plt.subplots(figsize=(_scratch_fig_w, _scratch_fig_h))
    _scratch_ax.set_position([0, 0, 1, 1])
    _scratch_ax.axis('off')

    # Render all rows as plain cells (no special header row) so Excel formatting is preserved.
    # bbox=[0, 0, 1, 1] forces the table to fill the entire axes area, eliminating whitespace.
    _scratch_tbl = _scratch_ax.table(cellText=_scratch_cell_text, loc='upper left', cellLoc='left',
                                      bbox=[0, 0, 1, 1])
    _scratch_tbl.auto_set_font_size(False)
    _scratch_tbl.set_fontsize(8)
    _scratch_tbl.auto_set_column_width(col=list(range(_scratch_n_cols)))

    for _ri in range(_scratch_n_rows):
        for _ci in range(_scratch_n_cols):
            _cell = _scratch_tbl[_ri, _ci]
            _bg = _scratch_bg_colors[_ri][_ci]
            _fg = _scratch_fg_colors[_ri][_ci]
            _is_bold = _scratch_bold[_ri][_ci]
            if _bg:
                _cell.set_facecolor(_bg)
            if _fg:
                _cell.get_text().set_color(_fg)
            if _is_bold:
                _cell.get_text().set_fontweight('bold')

    _scratch_buf = _scratch_io.BytesIO()
    _scratch_fig.savefig(_scratch_buf, format='png', bbox_inches='tight', pad_inches=0.02, dpi=100)
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