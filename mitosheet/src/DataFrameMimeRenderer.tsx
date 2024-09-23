import React, { useEffect } from 'react';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getCellAtIndex, getCellText } from './jupyter/extensionUtils';
import { getLastNonEmptyLine } from './jupyter/code';

const CLASS_NAME = 'jp-DataFrameViewer';

const SpreadsheetDataframeComponent = (props: { htmlContent: string, jsCode?: string }) => {
    /**
     * The `useEffect` hook is used here to ensure that the JavaScript code is executed 
     * after the component has been mounted to the DOM. TReact does not automatically 
     * execute JavaScript code embedded within the HTML content. So by creating and 
     * appending a script tag dynamically, we can ensure that the JavaScript code executes.
     * 
     * The jsCode is the mito_frontend.js code, which creates the spreadsheet! 
     */
    useEffect(() => {
        if (props.jsCode) {
            // Dynamically create a script tag to execute the JS code
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.text = props.jsCode;
            document.body.appendChild(script);

            // Clean up the script after execution
            return () => {
                document.body.removeChild(script);
            };
        }
    }, [props.jsCode]);

    return (
        <div
            dangerouslySetInnerHTML={{ __html: props.htmlContent }}
        ></div>
    );
};

export class DataFrameMimeRenderer extends Widget implements IRenderMime.IRenderer {
    private _notebookTracker: INotebookTracker;
    private _defaultRenderer: IRenderMime.IRenderer;
    private _activeCellIndex: number;

    constructor(
        options: IRenderMime.IRendererOptions, 
        activeCellIndex: number | undefined,
        notebookTracker: INotebookTracker, 
        defaultRenderer: IRenderMime.IRenderer
    ) {
        super();
        this.addClass(CLASS_NAME);
        this._notebookTracker = notebookTracker;
        this._defaultRenderer = defaultRenderer;
        this._activeCellIndex = activeCellIndex || 0;
    }

    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        console.log('model', model)
        const originalRawData = model.data['text/html']?.toString();
        const isDataframeOutput = originalRawData?.includes('class="dataframe"');
        const notebook = this._notebookTracker.currentWidget?.content;
        const cells = notebook?.model?.cells;
        const activeCellIndex = this._activeCellIndex
        let inputCell = undefined
        let inputCellID = undefined

        // We cannot use the activeCellIndex to identify the cell ID because when running 
        // a bunch of cells in a row (for example, using run all cells), the active cell 
        // updates too quickly. Instead, we use the execution number of the cell to get 
        // the cell id. This also happens if the code cell that renders the dataframe takes ie: 1 second
        // to render and the user has run a few different cells. While the cell is waiting to execute, 
        // the active cell is updated! 

        // Using the execution count does not work either because the execution will not update
        // until the mime render is created. When we run the code `df`, that cell is responsible for
        // create the mime renderer. As a result, when we search the cells for the execution count, 
        // of ie: 3, the closest execution count that we get is 2. 

        const modelExecutionNumber = (model as any)?.executionCount;
        console.log('modelExecutionNumber', modelExecutionNumber)

        if (!cells) {
            throw new Error('No cells found in notebook')
        }

        for (let i = 0; i < cells.length; i++) {
            const cell = cells.get(i) as any;
            console.log('cell', i, cell)
    
            // Check if the cell is a code cell
            if (cell.type === 'code') {
                const executionCountEntry = cell.sharedModel.ymodel._map.get('execution_count');
                const executionCountContent = executionCountEntry.content; // Access 'content' directly as it's an object
                const arr = executionCountContent.arr; // Access 'arr' as an array
                const executionCount = arr[0];
                //console.log('cell.sharedModel.ymodel._map[execution_count][content]', cell.sharedModel.ymodel._map['execution_count']['content'])
                //console.log('cell.sharedModel.ymodel._map[execution_count][content][arr][0]', cell.sharedModel.ymodel._map['execution_count']['content']['arr'][0])
                // console.log(cell)
                console.log('executionCount', executionCount)
                
                // // If executionCount matches, this is the target cell
                if (executionCount === modelExecutionNumber) {
                    // Get the cell id 
                    console.log("FOUND", cell)
                    const idEntry = cell.sharedModel.ymodel._map.get('id');
                    const idContent = idEntry.content; // Access 'content' directly as it's an object
                    const arr = idContent.arr; // Access 'arr' as an array
                    inputCell = cell
                    inputCellID = arr[0];
                    break;
                }
            }
        }

        // If we were not able to find the input cell by execution count, 
        // we fallback to relying on the active cell index. We get the active 
        // cell index as easrly as posibble to try to win race conditions.
        if (!inputCell || !inputCellID) {
            console.log('FALLING BACK ON ACTIVE CELL INDEX')
            console.log('activeCellIndex!!!!', activeCellIndex)
            inputCell = getCellAtIndex(cells, activeCellIndex - 1)
            console.log('inputCell', inputCell)
            inputCellID = inputCell?.id
            console.log('inputCellID', inputCellID)
        } else {
            console.log("USING EXECUTION COUNT")

        }

        let dataframeVariableName = getLastNonEmptyLine(getCellText(inputCell));
        console.log('dataframeVariableName', dataframeVariableName)

        if (isDataframeOutput) {
            // Define the Python code to run
            const pythonCode = `import mitosheet; mitosheet.sheet(${dataframeVariableName || ''}, cell_id='${inputCellID}')`;

            try {
                const notebookPanel = this._notebookTracker.currentWidget;
                const kernel = notebookPanel?.context.sessionContext.session?.kernel;

                if (!kernel) {
                    // TODO: Instead of not returning anything, we could return the default renderer or something else
                    console.error('No active kernel found while trying to render dataframe');
                    return;
                }

                // Execute the Python code
                const future = kernel.requestExecute({ code: pythonCode });

                future.onIOPub = (msg: any) => {

                    // The display_data message type is returned from the mitosheet.sheet call
                    if (msg.header.msg_type === 'display_data') {
                        const htmlOutput = msg.content.data['text/html'];
                        if (htmlOutput) {
                            // Extract the javascript code so we can execute it when we render the output.
                            // Remember, that the javascript code is actually what creates the sheet interface!
                            const scriptMatch = htmlOutput.match(/<script[^>]*>([\s\S]*?)<\/script>/);
                            const jsCode = scriptMatch ? scriptMatch[1] : '';

                            // Create a React widget to display the HTML output
                            const reactWidget = ReactWidget.create(
                                <SpreadsheetDataframeComponent htmlContent={htmlOutput} jsCode={jsCode} />
                            );

                            // Attatch the Mito widget to the node
                            this.node.innerHTML = '';
                            Widget.attach(reactWidget, this.node);
                        }
                    }
                };
            } catch (error) {
                console.error('Error executing Python code:', error);
                // If something goes wrong, just display the default dataframe output
                // TODO: Instead of appending the default renderer, just return the default renderer
                // so that we are not adding extra divs and potentially effecting the styling.
                await this._defaultRenderer.renderModel(model);
                this.node.appendChild(this._defaultRenderer.node);
            }
        } else {
            // If the output is not a dataframe, just use the default renderer
            // TODO: Instead of appending the default renderer, just return the default renderer
            // so that we are not adding extra divs and potentially effecting the styling.
            await this._defaultRenderer.renderModel(model);
            this.node.appendChild(this._defaultRenderer.node);
        }

        return Promise.resolve();
    }
}

export default DataFrameMimeRenderer;