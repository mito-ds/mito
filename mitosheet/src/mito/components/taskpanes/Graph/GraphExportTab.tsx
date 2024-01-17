// Copyright (c) Saga Inc.

import React from 'react';
import { MitoAPI } from '../../../api/api';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { GraphOutput, GraphParamsFrontend } from '../../../types';
import { isInDashboard } from '../../../utils/location';
import TextButton from '../../elements/TextButton';
import Row from '../../layout/Row';

/* 
    The export tab that lets the user copy the graph code or download as a png
*/
function GraphExportTab(
    props: {
        mitoAPI: MitoAPI;
        graphParams: GraphParamsFrontend
        graphOutput: GraphOutput,
        graphTabName: string,
        mitoContainerRef: React.RefObject<HTMLDivElement>,
        loading: boolean
    }): JSX.Element {

    // We append the correct export code for showing and for exporting to html
    const [_copyShowGraphCode, showGraphCodeCopied] = useCopyToClipboard(
        (props.graphOutput?.graphGeneratedCode || '') + `\nfig.show(renderer="iframe")`
    );
    const [_copyExportHTMLGraphCode, exportHTMLGraphCodeCopied] = useCopyToClipboard(
        (props.graphOutput?.graphGeneratedCode || '') + `\nfig.write_html("${props.graphTabName}.html")`
    );

    const copyShowGraphCode = () => {
        _copyShowGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_graph_code', {
            'graph_type': props.graphParams.graphCreation.graph_type
        });
    }
    const copyExportHTMLGraphCode = () => {
        _copyExportHTMLGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_export_html_graph_code', {
            'graph_type': props.graphParams.graphCreation.graph_type
        });
    }

    return (  
        <div className='graph-sidebar-toolbar-content'>
            <div>
                <TextButton
                    variant='dark'
                    onClick={copyShowGraphCode}
                    disabled={props.loading || props.graphOutput === undefined}
                    tooltip={'Click to copy code that creates graph and displays it in the notebook'}
                >
                    {!showGraphCodeCopied
                        ? "Copy code that displays graph"
                        : "Copied to Clipboard!"
                    }
                </TextButton>
                {(exportHTMLGraphCodeCopied && !isInDashboard()) ? (<Row justify='center' className='text-subtext-1'>Paste copied code in code cell below</Row>) : <></>}
            </div>
            <div>
                <TextButton
                    variant='dark'
                    onClick={copyExportHTMLGraphCode}
                    disabled={props.loading || props.graphOutput === undefined}
                    tooltip={'Click to copy code that creates graph and exports it as an html file'}
                >
                    {!exportHTMLGraphCodeCopied
                        ? "Copy code to create graph HTML file"
                        : "Copied to Clipboard!"
                    }
                </TextButton>
                {(exportHTMLGraphCodeCopied && !isInDashboard()) ? (<Row justify='center' className='text-subtext-1'>Paste copied code in code cell below</Row>) : <></>}
            </div>
            <div>
                <TextButton
                    variant='dark'
                    onClick={() => {
                        // Find the Plotly Download plot as png button, and then click it. 
                        const downloadLink: HTMLLinkElement | undefined | null = props.mitoContainerRef.current?.querySelector<HTMLLinkElement>('[data-title="Download plot as a png"]')
                        downloadLink?.click()

                        // Log that the user exported the graph as a png
                        void props.mitoAPI.log('export_graph_as_png', {
                            'graph_type': props.graphParams.graphCreation.graph_type
                        });
                    }}
                    disabled={props.loading || props.graphOutput === undefined}
                    tooltip={'Click to download graph as png'}
                >
                    Download as PNG
                </TextButton>
            </div>
        </div>
    )
} 

export default GraphExportTab;