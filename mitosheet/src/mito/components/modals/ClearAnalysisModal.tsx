// Copyright (c) Mito

import React, { useEffect } from 'react';
import { ModalEnum } from './modals';
import DefaultModal from '../DefaultModal';
import { MitoAPI } from '../../api/api';
import TextButton from '../elements/TextButton';
import { UIState } from '../../types';


type ResetAnalysisProps = {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI;
};

/* 
  A modal that confirms with the user that they want to clear
  the entire analysis export for simple import steps
*/
const ClearAnalysisModal = (props: ResetAnalysisProps): JSX.Element => {


    useEffect(() => {
        // Log that we opened this
        void props.mitoAPI.log('click_open_clear_analysis')
    }, [])

    const clickClear = async () => {

        // Actually send the reset message
        void props.mitoAPI.updateClear();

        // Close the modal
        props.setUIState((prevUIState) => {
            return {
                ...prevUIState,
                currOpenModal: {type: ModalEnum.None}
            }
        })
    }


    return (
        <DefaultModal
            header={`Clear your current analysis?`}
            modalType={ModalEnum.ClearAnalysis}
            viewComponent= {
                <>
                    <p className='body-text-1'>
                        This will undo all transformations and you&apos;ve made to imported dataframes and delete all of the graphs you&apos;ve created.
                    </p>
                </>
            }
            buttons = {
                <>
                    <TextButton
                        variant='light'
                        width='small'
                        onClick={() => {
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })
                        }} 
                    >
                        Close
                    </TextButton>
                    <TextButton
                        variant='dark'
                        width='small'
                        onClick={clickClear} 
                    >
                        Clear
                    </TextButton>
                </>
            }
        />
    )
} 

export default ClearAnalysisModal;