// Copyright (c) Mito

import React from 'react';
import { MitoAPI } from '../../api/api';
import { GraphData, GraphID, UIState } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { deleteGraphs } from '../taskpanes/Graph/graphUtils';
import { ModalEnum } from './modals';


type DeleteGraphsModalProps = {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI;
    graphDataArray: GraphData[];
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
        await deleteGraphs(graphIDs, props.mitoAPI, props.setUIState, props.graphDataArray)
        
        // Then delete the dataframe
        await props.mitoAPI.editDataframeDelete(props.sheetIndex)
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