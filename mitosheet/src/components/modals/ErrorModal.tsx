// Copyright (c) Mito

import React, {Fragment, useState} from 'react';
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
    const [viewTraceback, setViewTraceback] = useState(false);

    if (props.error === undefined) {
        return (<></>)
    }

    return (
        <DefaultModal
            header={props.error.header}
            modalType={ModalEnum.Error}
            viewComponent={
                <Fragment>
                    {props.error.to_fix &&
                        <div className='text-align-left text-body-1' onClick={() => setViewTraceback((viewTraceback) => !viewTraceback)}>
                            {props.error.to_fix} 
                            {props.error.traceback && 
                                <div className='text-body-1-link'>
                                    Toggle view traceback.
                                </div>
                            }
                        </div>
                    }
                    {props.error.traceback && viewTraceback &&
                        <div className='flex flex-column text-align-left text-overflow-hidden text-overflow-scroll mt-5px' style={{height: '200px', border: '1px solid var(--mito-purple)'}}>
                            {props.error.traceback.split('\n').map(p => {
                                return <p>{p}</p>
                            })} 
                        </div>
                    }
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