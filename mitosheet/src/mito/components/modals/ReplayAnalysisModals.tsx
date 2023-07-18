// Copyright (c) Mito

import React, { Fragment, useState } from 'react';
import { MitoAPI } from '../../api/api';
import { MitoError, UIState, UserProfile } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';
import GetSupportButton from '../elements/GetSupportButton';



/*
    This modal displays to the user when:
    1. the analysis that they are replaying does not exist on their computer
    2. the analysis errors during replay for some other reason
*/
const ErrorReplayedAnalysisModal = (
    props: {
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI,
        userProfile: UserProfile,

        header: string,
        message: string,
        error: MitoError | undefined,

        oldAnalysisName: string;
        newAnalysisName: string;

        overwriteAnalysisToReplayToMitosheetCall?: (oldAnalysisName: string, newAnalysisName: string, mitoAPI: MitoAPI) => void
    }): JSX.Element => {

    const [viewTraceback, setViewTraceback] = useState(false);

    return (
        <DefaultModal
            header={props.header}
            modalType={ModalEnum.Error}
            wide
            viewComponent={
                <Fragment>
                    <div className='text-align-left text-body-1' onClick={() => setViewTraceback((viewTraceback) => !viewTraceback)}>
                        {props.message} {' '}
                        {props.error?.traceback && 
                            <span className='text-body-1-link'>
                                Click to view full traceback.
                            </span>
                        }
                    </div>
                    {props.error?.traceback && viewTraceback &&
                        <div className='flex flex-column text-align-left text-overflow-hidden text-overflow-scroll mt-5px' style={{height: '200px', border: '1px solid var(--mito-highlight)', borderRadius: '2px', padding: '5px'}}>
                            <pre>{props.error.traceback}</pre>
                        </div>
                    }
                </Fragment>
            }
            buttons={
                <>
                    <GetSupportButton 
                        userProfile={props.userProfile} 
                        setUIState={props.setUIState} 
                        mitoAPI={props.mitoAPI}
                    />
                    <TextButton
                        variant='dark'
                        width='medium'
                        onClick={() => {    
                            if (props.overwriteAnalysisToReplayToMitosheetCall) {
                                props.overwriteAnalysisToReplayToMitosheetCall(
                                    props.oldAnalysisName,
                                    props.newAnalysisName,
                                    props.mitoAPI
                                )
                            }
                            
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
                </> 
            }
        />
    )    
};

export default ErrorReplayedAnalysisModal;