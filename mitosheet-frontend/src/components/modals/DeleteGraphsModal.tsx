// Copyright (c) Mito

import React from 'react';
import { ModalEnum } from './modals';
import DefaultModal from '../DefaultModal';
import { MitoAPI } from '../../api/api';
import TextButton from '../elements/TextButton';
import { GraphID, UIState } from '../../types';
import { TaskpaneType } from '../taskpanes/taskpanes';


type DeleteGraphsModalProps = {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI;
    sheetIndex: number;
    dfName: string;
    dependantGraphTabNamesAndIDs: {
        graphTabName: string;
        graphID: GraphID;
    }[];
};

/* 
  A modal that confirms with the user that they want to delete the dataframe and 
  all of the depedant graphs
*/
const DeleteGraphsModal = (props: DeleteGraphsModalProps): JSX.Element => {
    const graphIDs: GraphID[] = props.dependantGraphTabNamesAndIDs.map(graphTabNameAndID => {return graphTabNameAndID.graphID})
    const graphTabNames: string[] = props.dependantGraphTabNamesAndIDs.map(graphTabNameAndID => {return graphTabNameAndID.graphTabName})

    const clickDelete = async () => {

        // Delete the graphs 
        graphIDs.forEach(graphID => {
            void props.mitoAPI.editGraphDelete(graphID)
        })
        
        // Then delete the dataframe
        await props.mitoAPI.editDataframeDelete(props.sheetIndex)

        // Select the previous sheet and close the modal
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                selectedTabType: 'data',
                selectedSheetIndex: prevUIState.selectedSheetIndex > 0 ? prevUIState.selectedSheetIndex - 1 : 0,
                currOpenModal: {type: ModalEnum.None},
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })
    }


    return (
        <DefaultModal
            header={`Delete Sheet and Dependant Graphs`}
            modalType={ModalEnum.ClearAnalysis}
            viewComponent= {
                <>
                    <p className='body-text-1'>
                        Deleting {props.dfName} will delete the following graphs that rely on it:&nbsp;
                        <span className='text-color-mito-highlight-important'>{graphTabNames.join(', ')}</span>
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
                        width='large'
                        onClick={clickDelete} 
                    >
                        Delete Sheet and Graphs
                    </TextButton>
                </>
            }
        />
    )
} 

export default DeleteGraphsModal;