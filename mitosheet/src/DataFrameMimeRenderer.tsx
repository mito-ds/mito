import React, { useEffect } from 'react';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getCellAtIndex, getCellIndexByID, getCellText } from './jupyter/extensionUtils';
import { getLastNonEmptyLine } from './jupyter/code';
import { OutputArea } from '@jupyterlab/outputarea';
import { CodeCell } from '@jupyterlab/cells';


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

    constructor(
        options: IRenderMime.IRendererOptions, 
        notebookTracker: INotebookTracker, 
        defaultRenderer: IRenderMime.IRenderer
    ) {
        super();
        this.addClass(CLASS_NAME);
        this._notebookTracker = notebookTracker;
        this._defaultRenderer = defaultRenderer;;
    }

    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {

        /* 

        This code is esponsible for creating a mitosheet to display the dataframe when Jupyter 
        is rendering a dataframe to the output cell. 

        The challenging part is figuring out which dataframe to display in the mitosheet. To figure this out,
        we need to find the code cell that triggered this dataframe render and get the dataframe on its last line. 

        Finding the code cell is challenging however. Below describes a few options we tried and why they don't work. 

        1. Using the activeCellIndex: We cannot use the activeCellIndex to identify the cell ID because when running 
        a bunch of cells in a row (for example, using run all cells) or when the code cell takes a few seconds to execute,
        the active cell in the notebook tracker updates before we're able to save it. As a result, we end up thinking the 
        code cell that triggered the dataframe render is at the bottom of the notebook. 

        2. Using the execution count: We cannot use the execution count because the execution count will not update
        until the mime render is created. When we run the code cell `df`, that cell is responsible for creating the mime renderer. 
        As a result, when we search the cells for the execution count, of ie: 3, the closest execution count that we get is 2. 
        
        Instead of using those approaches, we instead use the dom to find the corresponding code cell ID. This works as follows: 

        1. Render the default renderer so that the we have a DOM element to start with. 
        2. Traverse up to find the Code Cell that triggered the dataframe render (the first code cell we find)
        3. Get the code cell ID from the code cell's model. 
        4. Use the cell ID to find the input cell and read the dataframe name from it. 
        
        */

        const isDataframeOutput = model.data['text/html']?.toString()?.includes('class="dataframe"');
        const notebook = this._notebookTracker.currentWidget?.content;
        const cells = notebook?.model?.cells;
        let inputCellID = undefined

        // TODO: Document this. I think we need to first render the default renderer so that 
        // the this widget is created. Otherwise, the this.node will not be set and when we 
        // cannot use it traverse up to find the Output area.
        await this._defaultRenderer.renderModel(model);

        let widget: Widget | null = this as unknown as Widget;

        // Traverse up to find the OutputArea

        // TODO. Can we combine this with the following while loop?
        while (widget && !(widget instanceof OutputArea)) {
            widget = widget.parent;
        }

        if (widget instanceof OutputArea) {
            const outputArea = widget as OutputArea;

            // Access the parent CodeCell
            let parentWidget = outputArea.parent;
            while (parentWidget && !(parentWidget instanceof CodeCell)) {
                parentWidget = parentWidget.parent;
            }

            if (parentWidget instanceof CodeCell) {
                inputCellID = parentWidget.model.sharedModel.getId()
            } 
        }

        if (!cells) {
            throw new Error('No cells found in notebook')
        }

        // If we were not able to find the input cell by execution count, 
        // we fallback to relying on the active cell index. We get the active 
        // cell index as easrly as posibble to try to win race conditions.
        let inputCell = undefined
        if (inputCellID) {
            const inputCellIndex = getCellIndexByID(cells, inputCellID)
            if (inputCellIndex === undefined) {
                throw new Error('No input cell found')
            }
            inputCell = getCellAtIndex(cells, inputCellIndex)
        }

        if (!inputCell) {
            throw new Error('No input cell found')
        }

        let dataframeVariableName = getLastNonEmptyLine(getCellText(inputCell));
        console.log('dataframeVariableName', dataframeVariableName)

        if (isDataframeOutput ) {
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