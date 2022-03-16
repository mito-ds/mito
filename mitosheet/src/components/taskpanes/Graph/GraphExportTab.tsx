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
        <TextButton
            variant='dark'
            onClick={copyGraphCode}
            disabled={props.loading || !props.graphOutput !== undefined}
        >
            {graphCodeCopied
                ? "Copy Graph Code"
                : "Copied!"
            }
        </TextButton>
    )
} 

export default GraphExportTab;