/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { Fragment } from 'react';
import '../../../../../css/taskpanes/Graph/VisualizeWithAIModal.css';
import { GraphType } from './GraphSetupTab';
import { getGraphTypeFullName } from './graphUtils';
import DefaultModal from '../../DefaultModal';
import TextButton from '../../elements/TextButton';
import LoadingCircle from '../../icons/LoadingCircle';
import { ModalEnum } from '../../modals/modals';

const VisualizeWithAIModal = (props: {
    state:
        | { status: 'loading' }
        | { status: 'error'; message: string }
        | { status: 'ready'; suggestions: { graphType: GraphType; reason: string }[] };
    onClose: () => void;
    onSelectSuggestion: (graphType: GraphType) => void;
}): JSX.Element => {
    const view =
        props.state.status === 'loading' ? (
            <div className='visualize-ai-modal-loading'>
                <LoadingCircle />
                <p className='text-body-1 mt-10px'>Generating chart ideas…</p>
            </div>
        ) : props.state.status === 'error' ? (
            <p className='text-body-1 text-align-left'>{props.state.message}</p>
        ) : (
            <div className='visualize-ai-suggestion-list'>
                {props.state.suggestions.map((s, i) => (
                    <button
                        key={`${s.graphType}-${i}`}
                        type='button'
                        className='visualize-ai-suggestion-card'
                        onClick={() => props.onSelectSuggestion(s.graphType)}
                    >
                        <span className='visualize-ai-suggestion-title'>{getGraphTypeFullName(s.graphType)}</span>
                        <span className='visualize-ai-suggestion-reason text-body-2'>{s.reason}</span>
                    </button>
                ))}
            </div>
        );

    return (
        <DefaultModal
            header='Visualize with AI'
            modalType={ModalEnum.None}
            wide
            overlay
            viewComponent={[
                <Fragment key='visualize-ai-body'>
                    {view}
                </Fragment>,
            ]}
            buttons={[
                <Fragment key='visualize-ai-cancel'>
                    <TextButton variant='light' width='small' onClick={props.onClose}>
                        Cancel
                    </TextButton>
                </Fragment>,
            ]}
        />
    );
};

export default VisualizeWithAIModal;
