// Copyright (c) Mito

import React, {useState} from 'react';
import DefaultModal from '../DefaultModal'; 
import { ModalEnum } from './modals';
import TextButton from '../elements/TextButton';
import MitoAPI from '../../jupyter/api';
import { MitoError, UIState, UserProfile } from '../../types';
import GetSupportButton from '../elements/GetSupportButton';

/*
    A modal that displays error messages and gives
    users actions to recover.
*/
const ErrorModal = (
    props: {
        error: MitoError | undefined, 
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI;
        userProfile: UserProfile
    }): JSX.Element => {
    const [viewTraceback, setViewTraceback] = useState(false);

    if (props.error === undefined) {
        return (<></>)
    }

    return (
        <DefaultModal
            header={props.error.header}
            modalType={ModalEnum.Error}
            wide
            viewComponent={
                <>
                    {props.error.to_fix &&
                        <div className='text-align-left text-body-1' onClick={() => setViewTraceback((viewTraceback) => !viewTraceback)}>
                            {props.error.to_fix} {' '}
                            {props.error.traceback && 
                                <span className='text-body-1-link'>
                                    Click to view full traceback.
                                </span>
                            }
                        </div>
                    }
                    {props.error.traceback && viewTraceback &&
                        <div className='text-align-left text-overflow-hidden text-overflow-scroll mt-5px' style={{height: '200px', border: '1px solid var(--mito-purple)', borderRadius: '2px', padding: '5px'}}>
                            <pre>{props.error.traceback}</pre>
                        </div>
                    }
                </>
            }
            buttons={
                <>
                    <TextButton
                        variant='light'
                        width='small'
                        onClick={() => {props.setUIState((prevUIState) => {
                            return {
                                ...prevUIState,
                                currOpenModal: {type: ModalEnum.None}
                            }
                        })}}
                    >
                        Close
                    </TextButton>
                    <GetSupportButton 
                        userProfile={props.userProfile} 
                        setUIState={props.setUIState}
                        mitoAPI={props.mitoAPI}     
                    />
                </> 
            }
        />
    )    
};

export default ErrorModal;