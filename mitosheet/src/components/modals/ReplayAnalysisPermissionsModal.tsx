// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import MitoAPI from '../../jupyter/api';
import { SavedAnalysis, UIState } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';
import { overwriteAnalysisToReplayToMitosheetCall } from '../../jupyter/jupyterUtils';
import { isMitoError } from '../../utils/errors';
import { TaskpaneType } from '../taskpanes/taskpanes';


/**
 * This function returns a summary view of the analysis. Note that we don't do anything
 * super fancy here, as this will likely be a very rare flow as users will most often
 * trust where they are getting their notebooks from.
 */
const getAnalysisSummary = (analysis: SavedAnalysis): JSX.Element => {
    return (
        <>
            {analysis.steps_data.map((step_data, idx) => {
                return (
                    <div key={idx} className='flexbox-row text-overflow-scroll pb-10px'>
                        <div>
                            Step {idx}:{' '}
                            <span className='text-color-gray-important'>{step_data.step_type}</span>&nbsp;
                        </div>
                        <div title={JSON.stringify(step_data.params)}>
                            with params{' '}
                            <span className='text-color-gray-important'>{JSON.stringify(step_data.params)}</span>
                        </div>
                    </div>
                )
            })}   
        </>
    )
}


/*
    This modal displays to the user when they replay an analysis that
    was not created on their computer and last edited by them.

    It asks them to either trust the analysis, or start a new one
*/
const ReplayAnalysisPermissionsModal = (
    props: {
        mitoAPI: MitoAPI,
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;

        analysisName: string;
        analysis: SavedAnalysis;
        potentialNewAnalysisName: string;
    }): JSX.Element => {

    const [viewSteps, setViewSteps] = useState(false);

    useEffect(() => {
        if (viewSteps) {
            void props.mitoAPI.log('clicked_view_all_steps')
        }
    }, [viewSteps])

    return (
        <DefaultModal
            header={'Do you want to trust this analysis?'}
            modalType={ModalEnum.ReplayAnalysisPermissions}
            wide
            viewComponent={
                <>
                    <div className='text-align-left text-body-1' onClick={() => setViewSteps((viewTraceback) => !viewTraceback)}>
                        The <span>analysis_to_replay</span> {props.analysisName} was last edited by someone else. Make sure you trust who sent you this notebook before running this analysis. You can {" "}
                        <span className='text-body-1-link' onClick={e => e.stopPropagation()}>
                            <a href='https://docs.trymito.io/how-to/mitos-security-model' target="_blank" rel="noreferrer"> read more about security</a>
                        </span> {' '} or {' '}
                        <span className='text-body-1-link'>
                            view all steps.
                        </span>
                    </div>
                    {viewSteps &&
                        <div 
                            className='text-align-left text-overflow-hidden text-overflow-scroll mt-5px' 
                            style={{height: '200px', border: '1px solid var(--mito-purple)', borderRadius: '2px', padding: '5px'}}
                        >
                            {getAnalysisSummary(props.analysis)}
                        </div>
                    }
                </>
            }
            buttons={
                <>
                    <TextButton
                        variant='light'
                        width='medium'
                        onClick={() => {    
                            overwriteAnalysisToReplayToMitosheetCall(
                                props.analysisName,
                                props.potentialNewAnalysisName,
                                props.mitoAPI
                            )

                            void props.mitoAPI.log('clicked_start_new_analysis_from_replay_analysis_permissions_modal')
                            
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })}
                        }
                    >
                        Start New Analysis
                    </TextButton>
                    <TextButton
                        variant='dark'
                        width='medium'
                        onClick={async () => {  
                            void props.mitoAPI.log('clicked_trust_analysis')

                            const replayAnalysisError = await props.mitoAPI.updateReplayAnalysis(props.analysisName, props.analysis, undefined, true);

                            if (isMitoError(replayAnalysisError)) {
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenTaskpane: {
                                            type: TaskpaneType.UPDATEIMPORTS,
                                            failedReplayData: {
                                                analysisName: props.analysisName,
                                                analysis: props.analysis,
                                                error: replayAnalysisError,
                                                explicitlyTrustAnalysisByIgnoringAuthorHash: true
                                            }
                                        },
                                        currOpenModal: {type: ModalEnum.None}
                                    }
                                })
                            } else {
                                props.setUIState((prevUIState) => {
                                    return {
                                        ...prevUIState,
                                        currOpenModal: {type: ModalEnum.None}
                                    }
                                })}
                        }
                            
                        }
                    >
                        Trust analysis   
                    </TextButton>
                </> 
            }
        />
    )    
};

export default ReplayAnalysisPermissionsModal;