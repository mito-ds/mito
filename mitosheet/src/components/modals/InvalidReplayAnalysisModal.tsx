// Copyright (c) Mito

import React, { Fragment, useState } from 'react';
import MitoAPI from '../../api';
import { MitoError, UIState } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';

/*
    TODO:
*/
const InvalidReplayAnalysisModal = (
    props: {
        error: MitoError | undefined, 
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI
    }): JSX.Element => {
    const [viewTraceback, setViewTraceback] = useState(false);

    if (props.error === undefined) {
        return (<></>)
    }

    return (
        <DefaultModal
            header={"Analyis Could Not Be Replayed"}
            modalType={ModalEnum.Error}
            wide
            viewComponent={
                <Fragment>
                    {props.error.to_fix &&
                        <div className='text-align-left text-body-1' onClick={() => setViewTraceback((viewTraceback) => !viewTraceback)}>
                            There was an error in replaying your analysis. The generated code can be found below, but this anlaysis could not be replayed on the new dataset. {' '}
                            {props.error.traceback && 
                                <span className='text-body-1-link'>
                                    Click to view full traceback.
                                </span>
                            }
                        </div>
                    }
                    {props.error.traceback && viewTraceback &&
                        <div className='flex flex-column text-align-left text-overflow-hidden text-overflow-scroll mt-5px' style={{height: '200px', border: '1px solid var(--mito-purple)', borderRadius: '2px', padding: '5px'}}>
                            <pre>{props.error.traceback}</pre>
                        </div>
                    }
                </Fragment>
            }
            buttons={
                <>
                    <TextButton
                        variant='dark'
                        width='medium'
                        onClick={() => {
                            props.setUIState(prevUIState => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })
                        }}
                    >
                        Start New Analysis
                    </TextButton>
                </> 
            }
        />
    )    
};

export default InvalidReplayAnalysisModal;