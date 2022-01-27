// Copyright (c) Mito

import React, {Fragment} from 'react';
import DefaultModal from '../DefaultModal'; 
import { ModalEnum } from './modals';
import TextButton from '../elements/TextButton';
import MitoAPI from '../../api';
import { MitoError, UIState } from '../../types';

/*
    A modal that displays error messages and gives
    users actions to recover.
*/
const ErrorModal = (
    props: {
        error: MitoError | undefined, 
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI
    }): JSX.Element => {

    if (props.error === undefined) {
        return (<></>)
    }

    return (
        <DefaultModal
            header={props.error.header}
            modalType={ModalEnum.Error}
            viewComponent={
                <Fragment>
                    <div>
                        {props.error.to_fix} 
                    </div>
                </Fragment>
            }
            buttons={
                <Fragment>
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
                    <TextButton
                        variant='dark'
                        width='medium'
                        href='https://discord.gg/XdJSZyejJU'
                        target='_blank'
                        onClick={() => {
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })
                            void props.mitoAPI.sendLogMessage('clicked_discord_invite', {
                                'location': 'error modal'
                            });
                            return true;
                        }}
                    >
                        Get Immediate Support
                    </TextButton>
                </Fragment> 
            }
        />
    )    
};

export default ErrorModal;