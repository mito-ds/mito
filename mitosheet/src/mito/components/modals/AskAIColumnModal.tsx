/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { MitoAPI, getRandomId } from '../../api/api';
import { ColumnHeader, StepType, UIState } from '../../types';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';
import { AICompletionSelection, AITransformationParams } from '../taskpanes/AITransformation/AITransformationTaskpane';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';

const NUMBER_OF_ATTEMPTS = 3;

type ModalState =
    | { type: 'idle' }
    | { type: 'loading'; message: string }
    | { type: 'error'; message: string };

const AskAIColumnModal = (props: {
    mitoAPI: MitoAPI;
    columnHeader: ColumnHeader;
    dfName: string;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}): JSX.Element => {

    const [userInput, setUserInput] = useState('');
    const [modalState, setModalState] = useState<ModalState>({ type: 'idle' });

    const displayColumnHeader = getDisplayColumnHeader(props.columnHeader);

    const close = () => {
        props.setUIState(prev => ({ ...prev, currOpenModal: { type: ModalEnum.None } }));
    };

    const submit = async () => {
        if (userInput.trim() === '' || modalState.type === 'loading') {
            return;
        }

        const selection: AICompletionSelection = {
            selected_df_name: props.dfName,
            selected_column_headers: [props.columnHeader],
            selected_index_labels: [],
        };

        setModalState({ type: 'loading', message: 'Generating code...' });

        const previousFailedCompletions: [string, string][] = [];

        for (let i = 0; i < NUMBER_OF_ATTEMPTS; i++) {
            const completionOrError = await props.mitoAPI.getAICompletion(
                userInput,
                selection,
                previousFailedCompletions,
            );

            if (completionOrError === undefined || 'error' in completionOrError) {
                setModalState({ type: 'error', message: completionOrError?.error || 'Error accessing the AI API. Check your internet connection.' });
                return;
            }

            const completion = completionOrError.result;
            if ('error' in completion) {
                setModalState({ type: 'error', message: completion.error || 'Error accessing the AI API.' });
                return;
            }

            setModalState({ type: 'loading', message: 'Executing code...' });

            const params: AITransformationParams = {
                user_input: userInput,
                prompt_version: completion.prompt_version,
                prompt: completion.prompt,
                completion: completion.completion,
                edited_completion: completion.completion,
            };

            const stepID = getRandomId();
            const result = await props.mitoAPI._edit<AITransformationParams>(
                StepType.AiTransformation + '_edit',
                params,
                stepID,
            );

            if ('error' in result) {
                previousFailedCompletions.push([completion.completion, result.error]);
                setModalState({ type: 'error', message: `Execution failed (attempt ${i + 1}/${NUMBER_OF_ATTEMPTS}). ${i + 1 >= NUMBER_OF_ATTEMPTS ? 'Please change your prompt.' : 'Retrying...'}` });
                if (i + 1 < NUMBER_OF_ATTEMPTS) {
                    continue;
                }
                return;
            }

            // Success
            close();
            return;
        }
    };

    const isLoading = modalState.type === 'loading';

    return (
        <div className="overlay">
            <div className="mito-modal-container">
                <div className="mito-modal" style={{ minWidth: '340px', maxWidth: '480px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div
                            className="default-taskpane-header-exit-button-div"
                            onClick={close}
                        >
                            ✕
                        </div>
                    </div>
                    <div className="mito-modal-header-text-div text-color-mito-text mt-0">
                        <p className="text-align-center-important">Ask AI about <strong>{displayColumnHeader}</strong></p>
                    </div>
                    <div className="mito-modal-message">
                        <textarea
                            autoFocus
                            style={{ width: '100%', minHeight: '72px', resize: 'vertical', boxSizing: 'border-box', padding: '8px', fontFamily: 'inherit', fontSize: '13px' }}
                            placeholder={`e.g. "Only keep rows where ${displayColumnHeader} is greater than 100"`}
                            value={userInput}
                            disabled={isLoading}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void submit();
                                }
                            }}
                        />
                        {modalState.type !== 'idle' && (
                            <p style={{ marginTop: '6px', fontSize: '12px', color: modalState.type === 'error' ? '#ED4747' : '#555' }}>
                                {modalState.message}
                            </p>
                        )}
                    </div>
                    <div className="mito-modal-buttons">
                        <TextButton variant="light" width="small" onClick={close} disabled={isLoading}>
                            Cancel
                        </TextButton>
                        <TextButton variant="dark" width="small" onClick={() => void submit()} disabled={isLoading || userInput.trim() === ''}>
                            {isLoading ? 'Running...' : 'Submit'}
                        </TextButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskAIColumnModal;
