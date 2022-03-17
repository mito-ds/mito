// Copyright (c) Saga Inc.

import React from 'react';
import { GraphOutput, GraphParams } from '../../../types';
import MitoAPI from '../../../api';
import TextButton from '../../elements/TextButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

/* 
    The export tab that lets the user copy the graph code or download as a png
*/
function GraphExportTab(
    props: {
        mitoAPI: MitoAPI;
        graphParams: GraphParams
        loading: boolean
        graphOutput: GraphOutput
    }): JSX.Element {

    const [_copyGraphCode, graphCodeCopied] = useCopyToClipboard(props.graphOutput?.graphGeneratedCode);

    const copyGraphCode = () => {
        _copyGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_graph_code', {
            'graph_type': props.graphParams.graphCreation.graph_type
        });
    }

    return (  
        <div className='graph-sidebar-toolbar-content'>
            <div>
                <TextButton
                    variant='dark'
                    onClick={copyGraphCode}
                    disabled={props.loading || props.graphOutput === undefined}
                >
                    {!graphCodeCopied
                        ? "Copy Graph Code"
                        : "Copied!"
                    }
                </TextButton>
            </div>
            <div>
                <TextButton
                    variant='dark'
                    onClick={() => {
                        // Find the Plotly Download plot as png button, and then click it. 
                        const node: Element | undefined | null = document.querySelector('[data-title="Download plot as a png"]')
                        const clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        node?.dispatchEvent(clickEvent)
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