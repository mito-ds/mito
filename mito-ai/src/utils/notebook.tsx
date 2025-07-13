/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';
import { AIOptimizedCell } from '../websockets/completions/CompletionModels';
import { WindowedList } from '@jupyterlab/ui-components';

const INCLUDE_CELL_IN_APP = 'include-cell-in-app'

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined): Cell | undefined => {
    if (cellID === undefined) {
        return undefined
    }   

    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.widgets.find(cell => cell.model.id === cellID);
}

export const toggleActiveCellIncludeInAppMetadata = (notebookTracker: INotebookTracker): void => {
    const activeCellID = getActiveCellID(notebookTracker);
    toggleIncludeCellInAppMetadata(notebookTracker, activeCellID);
}

export const toggleIncludeCellInAppMetadata = (notebookTracker: INotebookTracker, cellID: string | undefined): void => {

    if (cellID === undefined) {
        return;
    }

    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(cell.model.metadata, INCLUDE_CELL_IN_APP)) {
        const originalVisibility = cell.model.getMetadata(INCLUDE_CELL_IN_APP);
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, !originalVisibility);
    } else {
        // If the metadata doesn't exist yet, that means the user has not yet toggled the visibility.
        // The default value is to show the output, so the first toggle should set the visibiltiy to false.
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, false);
    }
}

export const getActiveCellIncludeInApp = (notebookTracker: INotebookTracker): boolean => {
    const activeCellID = getActiveCellID(notebookTracker);
    return getIncludeCellInApp(notebookTracker, activeCellID);
}

export const getIncludeCellInApp = (notebookTracker: INotebookTracker, cellID: string | undefined): boolean => {
    /* 
    Checks the cell metadata tag to see if the user has marked that this cell should not be included in the app.
    */
    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return false;
    }

    if (!Object.prototype.hasOwnProperty.call(cell.model.metadata, INCLUDE_CELL_IN_APP)) {
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, true);
    }

    return cell.model.getMetadata(INCLUDE_CELL_IN_APP);
}

export const getActiveCellID = (notebookTracker: INotebookTracker): string | undefined => {
    return getActiveCell(notebookTracker)?.model.id
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string | undefined): string | undefined => {
    const cell = getCellByID(notebookTracker, codeCellID)
    return cell?.model.sharedModel.source
}

export const getActiveCellOutput = async (notebookTracker: INotebookTracker): Promise<string | undefined> => {
    const activeCellID = getActiveCellID(notebookTracker)
    return getCellOutputByID(notebookTracker, activeCellID)
}

export const getCellOutputByID = async (notebookTracker: INotebookTracker, codeCellID: string | undefined): Promise<string | undefined> => {
    // TODO: There is a bug where if the cell is not actually rendered on the screen, 
    // then the output is not captured. This is pretty unlikely to happen currently because
    // the agent scrolls to the cell.

    if (codeCellID === undefined) {
        return undefined
    }

    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);

    if (!(cell instanceof CodeCell)) {
        return undefined;
    }
    
    const outputNode = cell.outputArea?.node;
    if (!outputNode) return undefined;

    // Find the top-level Jupyter image output div
    // so we can check if there is a base64 encoded image 
    // already constructed for us.
    const renderedImageDiv = outputNode.querySelector(
      '.jp-RenderedImage.jp-OutputArea-output'
    ) as HTMLDivElement | null;

    // If the image is the top-level output, then just use that instead
    // of capturing the entire output node. This is much faster and handles
    // matplotlib graphs.
    if (renderedImageDiv) {
        const img = renderedImageDiv.querySelector('img');
        if (img && img.src.startsWith('data:image')) {
            console.log('image found in top-level output');
            // Remove the data URL prefix
            // The img is initially in the format data:image/png;base64, <base64_data>
            // We want to return the base64 data.
            const base64 = img.src.split(',')[1];
            return base64;
        }
    }

    // Fallback: (optional) handle other output types, or use captureNode if needed
    // Previously, we used html2canvas to capture the entire output node. This would
    // give us the output even if it was html, svg, text, etc. However, starting around 
    // Chrome release 138, html2canvas became untenably slow. https://issues.chromium.org/issues/429073017
    if (outputNode) {
        // If the AI requested, a cell output that we cannot provide, we just tell it 
        // "Cell Output is present in notebook, but not available to share with the AI right now"
        return "iVBORw0KGgoAAAANSUhEUgAABWIAAAA2CAYAAABN7eCtAAAMTmlDQ1BJQ0MgUHJvZmlsZQAASImVVwdYU8kWnltSIQQIREBK6E0QqQGkhNACSC+CqIQkQCgxJgQVO7K4gmsXESwrugqi2FZAFhvqqiuLgr0uFlSUdXFd7MqbEECXfeV7831z57//nPnnnHNn7r0DAL2LL5XmopoA5EnyZbEhAazJySksUg8gAkNAA2MBgS+QSznR0REAluH27+X1NYAo28sOSq1/9v/XoiUUyQUAINEQpwvlgjyIfwQAbxFIZfkAEKWQN5+VL1XidRDryKCDENcocaYKtyhxugpfGrSJj+VC/AgAsjqfL8sEQKMP8qwCQSbUocNogZNEKJZA7A+xb17eDCHEiyC2gTZwTrpSn53+lU7m3zTTRzT5/MwRrIplsJADxXJpLn/O/5mO/13ychXDc1jDqp4lC41Vxgzz9ihnRrgSq0P8VpIeGQWxNgAoLhYO2isxM0sRmqCyR20Eci7MGWBCPFGeG8cb4mOF/MBwiA0hzpDkRkYM2RRliIOVNjB/aIU4nxcPsR7ENSJ5UNyQzQnZjNjhea9lyLicIf4pXzbog1L/syIngaPSx7SzRLwhfcyxMCs+CWIqxIEF4sRIiDUgjpTnxIUP2aQWZnEjh21kilhlLBYQy0SSkACVPlaeIQuOHbLfnScfjh07kSXmRQ7hzvys+FBVrrBHAv6g/zAWrE8k4SQM64jkkyOGYxGKAoNUseNkkSQhTsXjetL8gFjVWNxOmhs9ZI8HiHJDlLwZxPHygrjhsQX5cHGq9PESaX50vMpPvDKbHxat8gffDyIAFwQCFlDAmg5mgGwgbu9t7IV3qp5gwAcykAlEwGGIGR6RNNgjgdc4UAh+h0gE5CPjAgZ7RaAA8p9GsUpOPMKprg4gY6hPqZIDHkOcB8JBLrxXDCpJRjxIBI8gI/6HR3xYBTCGXFiV/f+eH2a/MBzIRAwxiuEZWfRhS2IQMZAYSgwm2uIGuC/ujUfAqz+szjgb9xyO44s94TGhg/CAcJXQRbg5XVwkG+XlJNAF9YOH8pP+dX5wK6jphgfgPlAdKuNM3AA44K5wHg7uB2d2gyx3yG9lVlijtP8WwVdPaMiO4kRBKWMo/hSb0SM17DTcRlSUuf46Pypf00fyzR3pGT0/96vsC2EbPtoS+xY7hJ3FTmLnsRasEbCw41gT1oYdVeKRFfdocMUNzxY76E8O1Bm9Zr48WWUm5U51Tj1OH1V9+aLZ+crNyJ0hnSMTZ2blszjwiyFi8SQCx3EsZydnNwCU3x/V6+1VzOB3BWG2feGW/AaAz/GBgYGfvnBhxwE44AFfCUe+cDZs+GlRA+DcEYFCVqDicOWFAN8cdLj79IExMAc2MB5n4A68gT8IAmEgCsSDZDANep8F17kMzALzwGJQAsrAKrAeVIKtYDuoAXvBQdAIWsBJ8DO4AC6Bq+A2XD3d4DnoA6/BBwRBSAgNYSD6iAliidgjzggb8UWCkAgkFklG0pBMRIIokHnIEqQMWYNUItuQWuQAcgQ5iZxHOpCbyH2kB/kTeY9iqDqqgxqhVuh4lI1y0HA0Hp2KZqIz0UK0GF2BVqDV6B60AT2JXkCvol3oc7QfA5gaxsRMMQeMjXGxKCwFy8Bk2AKsFCvHqrF6rBk+58tYF9aLvcOJOANn4Q5wBYfiCbgAn4kvwJfjlXgN3oCfxi/j9/E+/DOBRjAk2BO8CDzCZEImYRahhFBO2Ek4TDgD91I34TWRSGQSrYkecC8mE7OJc4nLiZuJ+4gniB3Eh8R+EomkT7In+ZCiSHxSPqmEtJG0h3Sc1EnqJr0lq5FNyM7kYHIKWUIuIpeTd5OPkTvJT8gfKJoUS4oXJYoipMyhrKTsoDRTLlK6KR+oWlRrqg81nppNXUytoNZTz1DvUF+pqamZqXmqxaiJ1RapVajtVzundl/tnbq2up06Vz1VXaG+Qn2X+gn1m+qvaDSaFc2flkLLp62g1dJO0e7R3mowNBw1eBpCjYUaVRoNGp0aL+gUuiWdQ59GL6SX0w/RL9J7NSmaVppcTb7mAs0qzSOa1zX7tRhaE7SitPK0lmvt1jqv9VSbpG2lHaQt1C7W3q59SvshA2OYM7gMAWMJYwfjDKNbh6hjrcPTydYp09mr067Tp6ut66qbqDtbt0r3qG4XE2NaMXnMXOZK5kHmNeb7MUZjOGNEY5aNqR/TOeaN3lg9fz2RXqnePr2reu/1WfpB+jn6q/Ub9e8a4AZ2BjEGswy2GJwx6B2rM9Z7rGBs6diDY28ZooZ2hrGGcw23G7YZ9hsZG4UYSY02Gp0y6jVmGvsbZxuvMz5m3GPCMPE1EZusMzlu8oyly+KwclkVrNOsPlND01BThek203bTD2bWZglmRWb7zO6aU83Z5hnm68xbzfssTCwmWcyzqLO4ZUmxZFtmWW6wPGv5xsraKslqqVWj1VNrPWuedaF1nfUdG5qNn81Mm2qbK7ZEW7Ztju1m20t2qJ2bXZZdld1Fe9Te3V5sv9m+YxxhnOc4ybjqcdcd1B04DgUOdQ73HZmOEY5Fjo2OL8ZbjE8Zv3r82fGfndyccp12ON2eoD0hbELRhOYJfzrbOQucq5yvuNBcgl0WujS5vHS1dxW5bnG94cZwm+S21K3V7ZO7h7vMvd69x8PCI81jk8d1tg47mr2cfc6T4BngudCzxfOdl7tXvtdBrz+8HbxzvHd7P51oPVE0ccfEhz5mPnyfbT5dvizfNN/vfbv8TP34ftV+D/zN/YX+O/2fcGw52Zw9nBcBTgGygMMBb7he3PncE4FYYEhgaWB7kHZQQlBl0L1gs+DM4LrgvhC3kLkhJ0IJoeGhq0Ov84x4Al4try/MI2x+2Olw9fC48MrwBxF2EbKI5knopLBJayfdibSMlEQ2RoEoXtTaqLvR1tEzo3+KIcZEx1TFPI6dEDsv9mwcI2563O641/EB8SvjbyfYJCgSWhPpiamJtYlvkgKT1iR1TR4/ef7kC8kGyeLkphRSSmLKzpT+KUFT1k/pTnVLLUm9NtV66uyp56cZTMuddnQ6fTp/+qE0QlpS2u60j/wofjW/P52Xvim9T8AVbBA8F/oL1wl7RD6iNaInGT4ZazKeZvpkrs3syfLLKs/qFXPFleKX2aHZW7Pf5ETl7MoZyE3K3ZdHzkvLOyLRluRITs8wnjF7RofUXloi7ZrpNXP9zD5ZuGynHJFPlTfl68Af/TaFjeIbxf0C34KqgrezEmcdmq01WzK7bY7dnGVznhQGF/4wF58rmNs6z3Te4nn353Pmb1uALEhf0LrQfGHxwu5FIYtqFlMX5yz+tcipaE3RX0uSljQXGxUvKn74Tcg3dSUaJbKS60u9l279Fv9W/G37MpdlG5d9LhWW/lLmVFZe9nG5YPkv3034ruK7gRUZK9pXuq/csoq4SrLq2mq/1TVrtNYUrnm4dtLahnWsdaXr/lo/ff35ctfyrRuoGxQbuioiKpo2WmxctfFjZVbl1aqAqn2bDDct2/Rms3Bz5xb/LfVbjbaWbX3/vfj7G9tCtjVUW1WXbyduL9j+eEfijrM/sH+o3Wmws2znp12SXV01sTWnaz1qa3cb7l5Zh9Yp6nr2pO65tDdwb1O9Q/22fcx9ZfvBfsX+ZwfSDlw7GH6w9RD7UP2Plj9uOsw4XNqANMxp6GvMauxqSm7qOBJ2pLXZu/nwT44/7Woxbak6qnt05THqseJjA8cLj/efkJ7oPZl58mHr9NbbpyafunI65nT7mfAz534O/vnUWc7Z4+d8zrWc9zp/5Bf2L40X3C80tLm1Hf7V7dfD7e7tDRc9LjZd8rzU3DGx41inX+fJy4GXf77Cu3LhauTVjmsJ125cT73edUN44+nN3JsvbxXc+nB70R3CndK7mnfL7xneq/7N9rd9Xe5dR+8H3m97EPfg9kPBw+eP5I8+dhc/pj0uf2LypPap89OWnuCeS8+mPOt+Ln3+obfkd63fN72wefHjH/5/tPVN7ut+KXs58OfyV/qvdv3l+ldrf3T/vdd5rz+8KX2r/7bmHfvd2fdJ7598mPWR9LHik+2n5s/hn+8M5A0MSPky/uCvAAaUR5sMAP7cBQAtGQAGPDdSp6jOh4MFUZ1pBxH4T1h1hhws7gDUw3/6mF74d3MdgP07ALCC+vRUAKJpAMR7AtTFZaQOn+UGz53KQoRng++jP6XnpYN/U1Rn0q/8Ht0CpaorGN3+C4fZgwPYSmE8AAAAimVYSWZNTQAqAAAACAAEARoABQAAAAEAAAA+ARsABQAAAAEAAABGASgAAwAAAAEAAgAAh2kABAAAAAEAAABOAAAAAAAAAJAAAAABAAAAkAAAAAEAA5KGAAcAAAASAAAAeKACAAQAAAABAAAFYqADAAQAAAABAAAANgAAAABBU0NJSQAAAFNjcmVlbnNob3ShMho0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAB1mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj41NDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4xMzc4PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6VXNlckNvbW1lbnQ+U2NyZWVuc2hvdDwvZXhpZjpVc2VyQ29tbWVudD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Ci/m7O0AAAAcaURPVAAAAAIAAAAAAAAAGwAAACgAAAAbAAAAGwAAGvM06hkwAAAav0lEQVR4AeydBbQdNRPHw1ekuBZ3d6fowd3dCweX4g6HYi1QnOLu7i4t7u7u7lAcir0vv/2YfLm52XvvypXXzpzz3u7d2OS/k8lkkk1G6rJklBQBRUARUAQUAUVAEVAEFAFFQBFQBBQBRUARUAQUAUVAEVAEmobASOqIbRq2mrEioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAIJAuqIVUFQBBQBRUARUAQUAUVAEVAEFAFFQBFQBBQBRUARUAQUAUWgyQioI7bJAGv2ioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIqCNWZUARUAQUAUVAEVAEFAFFQBFQBBQBRUARUAQUAUVAEVAEFIEmI6CO2CYDrNkrAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgjliVAUVAEVAEFAFFQBFQBBQBRUARUAQUAUVAEVAEFAFFQBFQBJqMgDpimwywZq8IKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioA6YlUGFAFFQBFQBBQBRUARUAQUAUVAEVAEFAFFQBFQBBQBRUARaDIC6ohtMsCavSKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAuqIVRlQBBQBRUARUAQUAUVAEVAEFAFFQBFQBBQBRUARUAQUAUWgyQioI7bJAGv2ioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIqCNWZUARUAQUAUVAEVAEFAFFQBFQBBQBRUARUAQUAUVAEVAEFIEmI6CO2CYDrNkrAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgjliVAUVAEVAEFAFFQBFQBBQBRUARUAQUAUVAEVAEFAFFQBFQBJqMwHDjiP3888+jUPXq1cuMPPLI0TB5+NNPP5mff/5Zfrprz549zfjjj+9+640ioAgoAoqAItAKBP7++28zbNiwpKgxxhijFUWWWsZvv/1murq6TI8ePcxoo41Wat7NzKy7495MbDTv4ROBIvZzEUTKaGvt4r1IvUf0tL/++msCAf0C/YPS8I+A2AOMx0cdddRuVeHuzHu3Ano4YlZ13HD0MptclaY5YocOHWpef/118+qrrxruJ5tsMjP11FObxRZbzIwyyiilVuubb74xvXv3juZ5xRVXmEUWWSQaJg+POOIIc9FFF8lPd11ooYXM1Vdf7X43++aLL74wL7/8snnllVfMOOOMY+aee24zxxxzmO44CG82Vp2Y//TTT5+wtdlmm5n+/ft3IovKkyLgENhuu+3Mvffem+jlBx54wD3Xm85A4PLLLzf9+vVLmBk8eLCZccYZO4OxBrmg//z222+Tfuymm25qMFX7o3V33NuPoHLQbgReeukls/baaydsDBo0yKyxxhqpLBW1n1MzbiCgaFtrJ+8NVE+jRBB47733zPLLL5+EHH744aZPnz6RWPqoVQi0atwi9sBKK61kzjzzzFZVr5RyujPvPgA4lPHLCPHuxxtvPPlZdf3hhx/Mu+++W/U89mDKKac0E088cSyoY55l6ReLMK06rgh6I17a0h2xzALsv//+5vbbb4+iOeaYY5oTTjjBrLjiitHwPA+/++47s+CCC0aTNuKIHTBggLnggguq0rfKEcuqgEMOOcRceeWVVTzw4PzzzzfLLLNMNKyshy+++KIZMmRIkt1WW21lJpxwwrKybno+ncK7GDQbbrihGThwYNPrrQV0TwQ6RV633nprgwN20kknNY899lj3BLOFXN92223mjTfeMKOPPrrp27dv00u+7LLLkn6Bgu6++24z00wzNb3MMguQwQsTit3JEdspuGPXiF2ywgormHnmmafM19PRebW6rXU0GDmYe/755816662XpDzxxBOdUzaWVVH7OZZno8+KtrV28t5oHRuJNyLJu++kOOyww8wWW2zRCEQap0kI5Bm35JHXueaay/zyyy+m3Y7Y7sx7URG48847K2zX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"
    }

    return undefined;
}

export const getCellIndexByID = (notebookTracker: INotebookTracker, cellID: string | undefined): number | undefined => {
    const cellList = notebookTracker.currentWidget?.model?.cells

    if (cellList === undefined) {
        return undefined
    }

    // In order to get the cell index, we need to iterate over the cells and call the `get` method
    // to see the cells in order. Otherwise, the cells are returned in a random order.
    for (let i = 0; i < cellList.length; i++) {
        const cellModel = cellList.get(i)

        if (cellModel.id == cellID) {
            return i
        }
    }

    return undefined
}

export const setActiveCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined): void => {
    const cellIndex = getCellIndexByID(notebookTracker, cellID)
    const notebookPanel = notebookTracker.currentWidget
    if (notebookPanel !== undefined && notebookPanel !== null && cellIndex !== undefined) {
        notebookPanel.content.activeCellIndex = cellIndex
    }
}

export const writeCodeToCellByID = (
    notebookTracker: INotebookTracker,
    code: string | undefined,
    codeCellID: string,
): void => {
    if (code === undefined) {
        return;
    }

    const codeMirrorValidCode = removeMarkdownCodeFormatting(code);
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);

    if (cell) {
        cell.model.sharedModel.source = codeMirrorValidCode;
    }
}

export const getAIOptimizedCells = (
    notebookTracker: INotebookTracker
): AIOptimizedCell[] => {

    const cellList = notebookTracker.currentWidget?.model?.cells

    if (cellList == undefined) {
        return []
    }

    // In order to get the cell index, we need to iterate over the cells and call the `get` method
    // to see the cells in order. Otherwise, the cells are returned in a random order.
    const cells: AIOptimizedCell[] = []
    for (let i = 0; i < cellList.length; i++) {
        const cellModel = cellList.get(i)

        const cell: AIOptimizedCell = {
            id: cellModel.id,
            cell_type: cellModel.type,
            code: cellModel.sharedModel.source
        }

        cells.push(cell)
    }

    return cells
}

export function createCodeCellAtIndexAndActivate(notebookTracker: INotebookTracker, index: number): void {
    /* 
        Create a new code cell at index and make it the active cell.
    */

    const notebook = notebookTracker.currentWidget?.content
    if (notebook === undefined) {
        return;
    }

    if (index > 0) {
        notebook.activeCellIndex = index - 1;

        // insertBelow makes the new cell the active cell
        NotebookActions.insertBelow(notebook);
    } else {
        notebook.activeCellIndex = 0

        // insertAbove makes the new cell the active cell
        NotebookActions.insertAbove(notebook)
    }
}

export const didCellExecutionError = (cell: CodeCell): boolean => {
    /* 
        Check the cell's output for an error.
    */
    const outputs = cell?.model.outputs?.toJSON() || [];
    return outputs.some(output => output.output_type === "error");
}

export const getNotebookName = (notebookTracker: INotebookTracker): string => {
    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.title.label || 'Untitled'
}

export const highlightCodeCell = (notebookTracker: INotebookTracker, codeCellID: string): void => {
    /*
        Briefly highlights a code cell, to draw the user's attention to it.
    */
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    if (cell) {
        const cellElement = cell.node;
        const originalBackground = cellElement.style.background;

        // Add a yellow highlight
        cellElement.style.background = 'var(--purple-400)';

        // Remove highlight after 500ms
        cellElement.style.transition = 'background 0.5s ease';
        setTimeout(() => {
            cellElement.style.background = originalBackground;
        }, 500);
    }
}

export const highlightLinesOfCodeInCodeCell = (
    notebookTracker: INotebookTracker, 
    codeCellID: string, 
    startLine: number | undefined, 
    endLine: number | undefined
): void => {
    /*
        Briefly highlights a range of lines in a code cell, to draw the user's attention to it.

        If no start and end line is provided, then highlight the entire cell.
        
        Args:
            notebookTracker: The notebook tracker.
            codeCellID: The ID of the code cell.
            startLine: The 0-indexed start line number to highlight.
            endLine: The 0-indexed end line number to highlight (inclusive).
    */
    // Get the cell with the given ID
    const cell = getCellByID(notebookTracker, codeCellID);
    if (!cell) {
        return;
    }

    // Get the cell's editor
    const editor = cell.editor;
    if (!editor) {
        return;
    }

    // We expect the line numbers to be 0-indexed. To be safe, if the line numbers are out of bounds, we clamp them.
    const lines = editor.model.sharedModel.source.split('\n');
    const targetStartLine = startLine ? Math.min(Math.max(startLine, 0), lines.length - 1) : 0;
    const targetEndLine = endLine ? Math.min(Math.max(endLine, 0), lines.length - 1) : lines.length - 1;

    // Find the line elements in the DOM
    const cmEditor = cell.node.querySelector('.jp-Editor');
    if (!cmEditor) {
        return;
    }

    // Find all line elements
    const lineElements = cmEditor.querySelectorAll('.cm-line');
    const elementsToHighlight: HTMLElement[] = [];
    const originalBackgrounds: string[] = [];

    // Collect all line elements in the range
    for (let i = targetStartLine; i <= targetEndLine; i++) {
        if (i < lineElements.length) {
            const lineElement = lineElements[i] as HTMLElement;
            if (lineElement) {
                elementsToHighlight.push(lineElement);
                originalBackgrounds.push(lineElement.style.background);
            }
        }
    }

    // Highlight all lines in the range
    elementsToHighlight.forEach(lineElement => {
        lineElement.style.background = 'var(--purple-400)';
        lineElement.style.transition = 'background 0.5s ease';
    });

    // Reset the background colors after a delay
    setTimeout(() => {
        elementsToHighlight.forEach((lineElement, index) => {
            lineElement.style.background = originalBackgrounds[index] || '';
        });
    }, 2000);
}

export const scrollToAndHighlightCell = (
    notebookTracker: INotebookTracker, 
    cellID: string, 
    startLine: number | undefined,
    endLine?: number,
    position: WindowedList.BaseScrollToAlignment = 'center'
): void => {

    // Scroll to the cell
    scrollToCell(notebookTracker, cellID, startLine, position);

    // Wait for the scroll animation to complete before highlighting the lines
    // The default smooth scroll takes about 300-500ms to complete
    setTimeout(() => {

        if (startLine !== undefined) {
            // If no end line was provided, then we just highlight the single line 
            endLine = endLine || startLine;
            highlightLinesOfCodeInCodeCell(notebookTracker, cellID, startLine, endLine);
        } else {
            // If no start line was provided, then we just highlight the entire cell
            highlightLinesOfCodeInCodeCell(notebookTracker, cellID, undefined, undefined);
        }
    }, 500);
}

export const scrollToCell = (
    notebookTracker: INotebookTracker, 
    cellID: string, 
    startLine: number | undefined,
    position: WindowedList.BaseScrollToAlignment = 'center'
): void => {

    // Get the cell
    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return;
    }

    // If line numbers are provided, figure out what position to scroll to 
    // based on the start line's position in the cell
    const code = getCellCodeByID(notebookTracker, cellID);

    startLine = startLine || 0;
    const relativeLinePosition = startLine / (code?.split('\n').length || 1);

    // These positions must be of type BaseScrollToAlignment defined in @jupyterlab/ui-components
    position = relativeLinePosition < 0.5 ? 'start' : 'end';

    // If the cell is not the active cell, the scrolling does not work. 
    // It scrolls to the cell and then flashes back to the active cell.
    setActiveCellByID(notebookTracker, cellID);

    // Use the new JupyterLab scrollToCell method instead of DOM node scrollIntoView
    void notebookTracker.currentWidget?.content.scrollToCell(cell, position);
}