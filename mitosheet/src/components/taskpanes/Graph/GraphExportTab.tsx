// Copyright (c) Saga Inc.

import React from 'react';
import { AnalysisData, GraphOutput, GraphParams } from '../../../types';
import MitoAPI from '../../../jupyter/api';
import TextButton from '../../elements/TextButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';


const getStreamlitCode = (analysisCode: string, graphCode: string) => {
    return `import plotly.express as px
import streamlit as st
import plotly.figure_factory as ff
import numpy as np
    
    ${analysisCode}

    ${graphCode}
    
st.plotly_chart(fig, use_container_width=True)`
}

/* 
    The export tab that lets the user copy the graph code or download as a png
*/
function GraphExportTab(
    props: {
        mitoAPI: MitoAPI;
        graphParams: GraphParams
        loading: boolean
        graphOutput: GraphOutput
        mitoContainerRef: React.RefObject<HTMLDivElement>,
        analysisData: AnalysisData
    }): JSX.Element {

    const [_copyStreamlitCode, streamlitCodeCopied] = useCopyToClipboard(getStreamlitCode(props.analysisData.code.join('\n'), props.graphOutput?.graphGeneratedCode || ''));
    const [_copyGraphCode, graphCodeCopied] = useCopyToClipboard(props.graphOutput?.graphGeneratedCode);

    const copyStreamlitCode = () => {
        _copyStreamlitCode()

        // Log that the user copied the streamlit code
        void props.mitoAPI.log('copy_streamlit_code', {
            'graph_type': props.graphParams.graphCreation.graph_type
        });
    }

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
                    onClick={copyStreamlitCode}
                    disabled={props.loading || props.graphOutput === undefined}
                >
                    {!streamlitCodeCopied
                        ? "Copy Streamlit Code"
                        : "Copied to Clipboard!"
                    }
                </TextButton>
            </div>
            <div>
                <TextButton
                    variant='dark'
                    onClick={copyGraphCode}
                    disabled={props.loading || props.graphOutput === undefined}
                >
                    {!graphCodeCopied
                        ? "Copy Graph Code"
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