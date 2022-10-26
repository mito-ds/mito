// Copyright (c) Mito

import React, { Fragment, useState } from 'react';
import MitoAPI from '../../jupyter/api';
import { SLACK_INVITE_LINK } from '../../data/documentationLinks';
import { SavedAnalysis, UIState } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';



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
        analysis: SavedAnalysis
    }): JSX.Element => {

    const [viewTraceback, setViewTraceback] = useState(false);

    return (
        <DefaultModal
            header={'Are you sure you want to replay'}
            modalType={ModalEnum.ReplayAnalysisPermissions}
            wide
            viewComponent={
                <Fragment>
                    <div className='text-align-left text-body-1' onClick={() => setViewTraceback((viewTraceback) => !viewTraceback)}>
                        <span className='text-body-1-link'>
                            This is not your analysis. Do you trust where this notebook is coming from?
                        </span>
                    </div>
                    {viewTraceback &&
                        <div className='flex flex-column text-align-left text-overflow-hidden text-overflow-scroll mt-5px' style={{height: '200px', border: '1px solid var(--mito-purple)', borderRadius: '2px', padding: '5px'}}>
                            <pre>{props.analysis}</pre>
                        </div>
                    }
                </Fragment>
            }
            buttons={
                <>
                    <TextButton
                        variant='light'
                        width='medium'
                        href={SLACK_INVITE_LINK}
                        target='_blank'
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
                        Replay analysis   
                    </TextButton>
                </> 
            }
        />
    )    
};

export default ReplayAnalysisPermissionsModal;