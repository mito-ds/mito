// Copyright (c) Mito

import React, { Fragment } from 'react';
import { MitoAPI } from '../../api/api';
import { UIState, UserProfile } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';

/*
    This modal displays to the user when:
    1. the analysis that they are replaying does not exist on their computer
    2. the analysis errors during replay for some other reason
*/
const OverwriteCodeModal = (
    props: {
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI,
        userProfile: UserProfile,

        header: string,
        message: string,

    }): JSX.Element => {


    return (
        <DefaultModal
            header={props.header}
            modalType={ModalEnum.Error}
            wide
            viewComponent={
                <Fragment>
                    <div className='text-align-left text-body-1'>
                        {props.message} {' '}
                    </div>
                </Fragment>
            }
            buttons={
                <>
                    <TextButton 
                        variant='dark'
                        width='medium'
                        onClick={() => props.setUIState((prevUIState) => {
                            return {
                                ...prevUIState,
                                currOpenModal: {type: ModalEnum.None},
                                overwriteIfUserEditedCode: true
                            }
                        })}
                    >
                        Overwrite Changes
                    </TextButton>
                    <TextButton
                        variant='dark'
                        width='hug-contents'
                        onClick={() => {    
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None},
                                    overwriteIfUserEditedCode: false
                                }
                            })
                        }}
                    >
                        Keep Changes and Create New Cell
                    </TextButton>
                </> 
            }
        />
    )    
};

export default OverwriteCodeModal;