import { JupyterFrontEnd } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';

const CLASS_NAME = 'jp-DataFrameViewer';

// React component to display the output from Python
const SheetOutputComponent = (props: { htmlContent: string, jsCode?: string }) => {
    // Hook to run the JavaScript code after the component is mounted
    React.useEffect(() => {
        if (props.jsCode) {
            // Dynamically create a script tag to execute the JS code
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.text = props.jsCode;
            document.body.appendChild(script);
            console.log("JavaScript code injected and executed.");

            // Clean up the script after execution
            return () => {
                document.body.removeChild(script);
            };
        }
    }, [props.jsCode]);

    return (
        <div
            dangerouslySetInnerHTML={{ __html: props.htmlContent }}
            style={{ padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}
        ></div>
    );
};

export class DataFrameMimeRenderer extends Widget implements IRenderMime.IRenderer {
    private _app: JupyterFrontEnd;
    private _notebookTracker: INotebookTracker;

    constructor(app: JupyterFrontEnd, options: IRenderMime.IRendererOptions, notebookTracker: INotebookTracker) {
        super();
        this._app = app;
        this.addClass(CLASS_NAME);
        this._notebookTracker = notebookTracker;
    }

    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        this.node.innerHTML = '';  // Clear previous content
        const originalRawData = model.data['text/html']?.toString();
        const isDataframeOutput = originalRawData?.includes('class="dataframe"');

        if (isDataframeOutput) {
            console.log('Dataframe detected!!!!');

            // Define the Python code to run
            const pythonCode = `
from IPython.display import display, HTML

def sheet():
    display(mitosheet.sheet())

sheet()
`;

            try {
                const notebookPanel = this._notebookTracker.currentWidget;
                const kernel = notebookPanel?.context.sessionContext.session?.kernel;


                if (!kernel) {
                    console.error('No active kernel found.');
                    return;
                }

                console.log("GOT A KERNEL")

                // Execute the Python code
                const future = kernel.requestExecute({ code: pythonCode });

                future.onIOPub = (msg: any) => {
                    if (msg.header.msg_type === 'execute_result' || msg.header.msg_type === 'display_data') {
                        const htmlOutput = msg.content.data['text/html'];
                        if (htmlOutput) {
                            console.log('Received HTML output:', htmlOutput);
                            const scriptMatch = htmlOutput.match(/<script[^>]*>([\s\S]*?)<\/script>/);
                            const jsCode = scriptMatch ? scriptMatch[1] : '';

                            // Create a React widget to display the HTML output
                            const reactWidget = ReactWidget.create(
                                <SheetOutputComponent htmlContent={htmlOutput} jsCode={jsCode} />
                            );

                            // Clear previous content and append the React widget
                            this.node.innerHTML = '';
                            Widget.attach(reactWidget, this.node);
                        }
                    }
                };

                future.done.then(() => {
                    console.log('Python code executed successfully.');
                })

            } catch (error) {
                console.error('Error executing Python code:', error);
                this.node.innerHTML = `<div style="color: red;">Error rendering sheet</div>`;
            }

        } else {
            console.log("Non-dataframe content detected");
            console.log(this._app);
            this.node.appendChild(document.createTextNode("Non-dataframe content"));
        }

        return Promise.resolve();
    }

    dispose(): void {
        super.dispose();
    }
}

export default DataFrameMimeRenderer;