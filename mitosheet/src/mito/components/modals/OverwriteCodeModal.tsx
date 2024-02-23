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
const UserEditedCodeModal = (
    props: {
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI,
        userProfile: UserProfile,
    }): JSX.Element => {
    return (
        <DefaultModal
            header='Insert New Cell?'
            modalType={ModalEnum.Error}
            wide
            viewComponent={
                <Fragment>
                    <div className='text-align-left text-body-1'>
                        Looks like you changed the code in the cell below the Mitosheet. Do you want to overwrite these changes or insert a new cell for the Mito generated code?
                    </div>
                </Fragment>
            }
            buttons={
                <>
                    <TextButton 
                        variant='light'
                        width='hug-contents'
                        onClick={() => {
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None},
                                    overwriteIfUserEditedCode: true
                                }
                            })
                            void props.mitoAPI.log('overwrite_user_edited_code')
                        }}
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
                            void props.mitoAPI.log('insert_new_cell_for_user_edited_code')
                        }}
                    >
                        Insert New Cell
                    </TextButton>
                </> 
            }
        />
    )    
};

export default UserEditedCodeModal;