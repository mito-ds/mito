// Copyright (c) Saga Inc.

import React from 'react';
import { GraphParams } from '../../../types';
import MitoAPI from '../../../api';
import TextButton from '../../elements/TextButton';

/* 
    The export tab that lets the user copy the graph code or download as a png
*/
function GraphExportTab(
    props: {
        graphCodeCopied: boolean;
        _copyGraphCode: () => void;
        mitoAPI: MitoAPI;
        graphParams: GraphParams
        loading: boolean
        graphOutputDefined: boolean
    }): JSX.Element {

    const copyGraphCode = () => {
        props._copyGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_graph_code', {
            'graph_type': props.graphParams.graphCreation.graph_type
        });
    }

    return (  
        <TextButton
            variant='dark'
            onClick={copyGraphCode}
            disabled={props.loading || !props.graphOutputDefined}
        >
            {!props.graphCodeCopied
                ? "Copy Graph Code"
                : "Copied!"
            }
        </TextButton>
    )
} 

export default GraphExportTab;