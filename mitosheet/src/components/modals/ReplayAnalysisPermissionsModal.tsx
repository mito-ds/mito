// Copyright (c) Mito

import React, { useState } from 'react';
import MitoAPI from '../../jupyter/api';
import { SavedAnalysis, UIState } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';
import { overwriteAnalysisToReplayToMitosheetCall } from '../../jupyter/jupyterUtils';
import Row from '../layout/Row';
import Col from '../layout/Col';
import { isMitoError } from '../../utils/errors';
import { TaskpaneType } from '../taskpanes/taskpanes';


/**
 * This function returns a summary view of the 
 */
const getAnalysisSummary = (analysis: SavedAnalysis): JSX.Element => {
    console.log(analysis.steps_data)
    return (
        <>
            {analysis.steps_data.map(step_data => {
                return (
                    <Row>
                        <Col>
                            {step_data.step_type}
                        </Col>
                        <Col>
                            {JSON.stringify(step_data.params)}
                        </Col>
                    </Row>
                )
            })}   
        </>
    )
}


/*
    This modal displays to the user when:
    1. the analysis that they are replaying does not exist on their computer
    2. the analysis errors during replay for some other reason
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

    return (
        <DefaultModal
            header={'Do you want to trust this analysis?'}
            modalType={ModalEnum.ReplayAnalysisPermissions}
            wide
            viewComponent={
                <>
                    <div className='text-align-left text-body-1' onClick={() => setViewSteps((viewTraceback) => !viewTraceback)}>
                        The <span>analysis_to_replay</span> {props.analysisName} was created by someone else. Make sure you trust who sent you this notebook before running this analysis.
                        <span className='text-body-1-link'>
                            Click to view parameters for all steps.
                        </span>
                    </div>
                    {viewSteps &&
                        <div 
                            className='flex flex-column text-align-left text-overflow-hidden text-overflow-scroll mt-5px' 
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
                                                error: replayAnalysisError
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