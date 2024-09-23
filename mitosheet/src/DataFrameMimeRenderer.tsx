import React, { useEffect } from 'react';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getCellAtIndex, getCellIndexByID, getCellText } from './jupyter/extensionUtils';
import { getLastNonEmptyLine } from './jupyter/code';
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

        try {

            const isDataframeOutput = model.data['text/html']?.toString()?.includes('class="dataframe"');

            if (!isDataframeOutput) {
                // If we're not rendering a dataframe, just use the default renderer
                await this._defaultRenderer.renderModel(model);
                this.node.appendChild(this._defaultRenderer.node);
                return Promise.resolve();
            }

            const notebookPanel = this._notebookTracker.currentWidget;
            const cells = notebookPanel?.model?.cells;
            let inputCellID = undefined

        
            /* 
                Create the starting dom element and then traverse up to find 
                the input code cell. 
            */

            await this._defaultRenderer.renderModel(model);

            let widget: Widget | null = this as unknown as Widget;
            while (widget && !(widget instanceof CodeCell)) {
                widget = widget.parent;
            }

            if (widget instanceof CodeCell) {
                inputCellID = widget.model.sharedModel.getId()
            } 

            /* 
                Get the dataframe variable name from the input cell. 
            */

            let dataframeVariableName = undefined
            if (inputCellID) {
                const inputCellIndex = getCellIndexByID(cells, inputCellID)
                if (inputCellIndex === undefined) {
                    throw new Error('No input cell found')
                }
                const inputCell = getCellAtIndex(cells, inputCellIndex)
                dataframeVariableName = getLastNonEmptyLine(getCellText(inputCell));
            }

            if (!dataframeVariableName) {
                throw new Error('No dataframe variable name found')
            }

            /* 
                To display the dataframe in Mito, we execute the mitosheet.sheet() function call, passing to it:
                1. the dataframe so it knows what data to display
                2. the cell ID so it knows where to write the generated code to.
            */
            const kernel = notebookPanel?.context.sessionContext.session?.kernel;
            if (!kernel) {
                throw new Error('No kernel found');
            }

            const pythonCode = `import mitosheet; mitosheet.sheet(${dataframeVariableName || ''}, cell_id='${inputCellID}')`;
            const future = kernel.requestExecute({ code: pythonCode });

            /* 
                Listen to the juptyer messages to find the response to the mitosheet.sheet() call. Once we get back the 
                mitosheet.sheet() html, display it!  
            */
            future.onIOPub = (msg: any) => {

                // The display_data message type is returned from the mitosheet.sheet call
                if (msg.header.msg_type === 'display_data') {
                    const htmlOutput = msg.content.data['text/html'];
                    
                    // Extract the javascript code so we can execute it when we render the output.
                    // Remember, that the javascript code is actually what creates the sheet interface!
                    const scriptMatch = htmlOutput.match(/<script[^>]*>([\s\S]*?)<\/script>/);
                    const jsCode = scriptMatch ? scriptMatch[1] : '';

                    const reactWidget = ReactWidget.create(
                        <SpreadsheetDataframeComponent htmlContent={htmlOutput} jsCode={jsCode} />
                    );

                    // Attatch the Mito widget to the node
                    this.node.innerHTML = '';
                    Widget.attach(reactWidget, this.node);
                }
            };
        } catch (error) {
            console.error('Dataframe Mime Renderer:', error);

            // If something goes wrong, just display the default dataframe output
            this.node.replaceWith(this._defaultRenderer.node);
        }

        return Promise.resolve();
    }
}

export default DataFrameMimeRenderer;