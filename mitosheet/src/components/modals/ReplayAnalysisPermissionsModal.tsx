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
            header={'This is someone elses analysis'}
            modalType={ModalEnum.ReplayAnalysisPermissions}
            wide
            viewComponent={
                <>
                    <div className='text-align-left text-body-1' onClick={() => setViewSteps((viewTraceback) => !viewTraceback)}>
                        It looks like someone else created this analysis and send you this notebook.
                        <span className='text-body-1-link'>
                            Click to expand parameters for all steps.
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
                        onClick={() => {  
                            void props.mitoAPI.updateReplayAnalysis(props.analysisName, props.analysis);
                            
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })}
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