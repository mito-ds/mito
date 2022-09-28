// Copyright (c) Saga Inc.

import React from 'react';
import { GraphOutput, GraphParamsFrontend } from '../../../types';
import MitoAPI from '../../../jupyter/api';
import TextButton from '../../elements/TextButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

/* 
    The export tab that lets the user copy the graph code or download as a png
*/
function GraphExportTab(
    props: {
        mitoAPI: MitoAPI;
        graphParams: GraphParamsFrontend
        loading: boolean
        graphOutput: GraphOutput,
        graphTabName: string,
        mitoContainerRef: React.RefObject<HTMLDivElement>
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
                >
                    {!showGraphCodeCopied
                        ? "Copy Show Graph Code"
                        : "Copied to Clipboard!"
                    }
                </TextButton>
            </div>
            <div>
                <TextButton
                    variant='dark'
                    onClick={copyExportHTMLGraphCode}
                    disabled={props.loading || props.graphOutput === undefined}
                >
                    {!exportHTMLGraphCodeCopied
                        ? "Copy Export HTML Graph Code"
                        : "Copied to Clipboard!"
                    }
                </TextButton>
            </div>
            <div>
                <TextButton
                    variant='dark'
                    onClick={() => {
                        // Find the Plotly Download plot as png button, and then click it. 
                        const downloadLink: HTMLLinkElement | undefined | null = props.mitoContainerRef.current?.querySelector<HTMLLinkElement>('[data-title="Download plot as a png"]')
                        downloadLink?.click()
                    }}
                    disabled={props.loading || props.graphOutput === undefined}
                >
                    Download as PNG
                </TextButton>
            </div>
        </div>
    )
} 

export default GraphExportTab;