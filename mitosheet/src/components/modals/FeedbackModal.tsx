// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import { ModalEnum } from './modals';
import DefaultModal from '../DefaultModal';
import MitoAPI from '../../api';
import TextButton from '../elements/TextButton';
import { FeedbackID, UIState, UsageTriggeredFeedbackID } from '../../types';
import RadioButtons from '../elements/RadioButtons';
import TextArea from '../elements/TextArea';

const UsageTriggeredFeedbackTitleMapping: Record<UsageTriggeredFeedbackID, string> = {
    [FeedbackID.PIVOT_USAGE_TRIGGERED]: 'Creating a Pivot Table Feedback',
    [FeedbackID.ADD_COLUMN_USAGE_TRIGGERED]: 'Adding a Column Feedback',
    [FeedbackID.DELETE_COLUMN_USAGE_TRIGGERED]: 'Deleting a Column Feedback',
    [FeedbackID.RENAME_COLUMN_USAGE_TRIGGERED]: 'Renaming a Column Feedback',
    [FeedbackID.REORDER_COLUMN_USAGE_TRIGGERED]: 'Reordering a Column Feedback',
    [FeedbackID.FILTER_COLUMN_USAGE_TRIGGERED]: 'Filtering a Column Feedback',
    [FeedbackID.SET_COLUMN_FORMULA_USAGE_TRIGGERED]: 'Setting a Column Formula Feedback',
    [FeedbackID.SET_CELL_VALUE_USAGE_TRIGGERED]: 'Setting Cell Value Feedback',
    [FeedbackID.DATAFRAME_DELETE_USAGE_TRIGGERED]: 'Deleting Dataframe Feedback',
    [FeedbackID.DATAFRAME_DUPLICATE_USAGE_TRIGGERED]: 'Duplicating Dataframe Feedback',
    [FeedbackID.DATAFRAME_RENAME_USAGE_TRIGGERED]: 'Renaming a Dataframe Feedback',
    [FeedbackID.SORT_USAGE_TRIGGERED]: 'Sorting a Column Feedback',
    [FeedbackID.MERGE_USAGE_TRIGGERED]: 'Merging Dataframes Feedback',
    [FeedbackID.CHANGE_COLUMN_DTYPE_USAGE_TRIGGERED]: 'Changing Column Dtype Feedback',
    [FeedbackID.CHANGE_COLUMN_FORMAT_USAGE_TRIGGERED]: 'Changing Column Format Feedback',
    [FeedbackID.SIMPLE_IMPORT_USAGE_TRIGGERED]: 'Importing CSV Feedback',
    [FeedbackID.EXCEL_IMPORT_USAGE_TRIGGERED]: 'Importing Excel File Feedback',
    [FeedbackID.DROP_DUPLICATES_USAGE_TRIGGERED]: 'Drop Duplicated Feedback',
    [FeedbackID.GRAPH_USAGE_TRIGGERED]: 'Graphing a sheet Feedback'
}

const UsageTriggeredFeedbackQuestionMapping: Record<UsageTriggeredFeedbackID, string> = {
    [FeedbackID.PIVOT_USAGE_TRIGGERED]: 'created a pivot table',
    [FeedbackID.ADD_COLUMN_USAGE_TRIGGERED]: 'added a column',
    [FeedbackID.DELETE_COLUMN_USAGE_TRIGGERED]: 'deleted a column',
    [FeedbackID.RENAME_COLUMN_USAGE_TRIGGERED]: 'renamed a column',
    [FeedbackID.REORDER_COLUMN_USAGE_TRIGGERED]: 'reordered a column',
    [FeedbackID.FILTER_COLUMN_USAGE_TRIGGERED]: 'filtered a column',
    [FeedbackID.SET_COLUMN_FORMULA_USAGE_TRIGGERED]: 'set a column formula',
    [FeedbackID.SET_CELL_VALUE_USAGE_TRIGGERED]: 'set a cell value',
    [FeedbackID.DATAFRAME_DELETE_USAGE_TRIGGERED]: 'deleted a dataframe',
    [FeedbackID.DATAFRAME_DUPLICATE_USAGE_TRIGGERED]: 'duplicated a dataframe',
    [FeedbackID.DATAFRAME_RENAME_USAGE_TRIGGERED]: 'renamed a dataframe',
    [FeedbackID.SORT_USAGE_TRIGGERED]: 'sorted a column',
    [FeedbackID.MERGE_USAGE_TRIGGERED]: 'merged dataframes together',
    [FeedbackID.CHANGE_COLUMN_DTYPE_USAGE_TRIGGERED]: 'changed a column dtype',
    [FeedbackID.CHANGE_COLUMN_FORMAT_USAGE_TRIGGERED]: 'changed a column format',
    [FeedbackID.SIMPLE_IMPORT_USAGE_TRIGGERED]: 'imported a CSV',
    [FeedbackID.EXCEL_IMPORT_USAGE_TRIGGERED]: 'imported an Excel file',
    [FeedbackID.DROP_DUPLICATES_USAGE_TRIGGERED]: 'dropped duplicates',
    [FeedbackID.GRAPH_USAGE_TRIGGERED]: 'graphed a sheet'
}

type FeedbackModalProps = {
    usageTriggereeFeedbackID: UsageTriggeredFeedbackID
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    numUsages: number
    mitoAPI: MitoAPI;
};

/* 
  A modal that confirms with the user that they want to clear
  the entire analysis export for simple import steps
*/
const FeedbackModal = (props: FeedbackModalProps): JSX.Element => {

    const questionOne = `How successful was it on a scale from 1-5?`;
    const questionTwo = 'Tell us about your experience.';

    const [firstResponse, setFirstResponse] = useState('');
    const [secondResponse, setSecondResponse] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Log when this opens
    useEffect(() => {
        void props.mitoAPI.log('usage_triggered_feedback_opened')
    }, []);

    return (
        <DefaultModal
            header={UsageTriggeredFeedbackTitleMapping[props.usageTriggereeFeedbackID]}
            modalType={ModalEnum.Feedback}
            setUIState={props.setUIState}
            overlay={true}
            viewComponent= {
                <div className='text-align-left'>
                    <label>
                        <h3 className='text-body-1 mt-5px mb-5px'>
                            You recently <b>{UsageTriggeredFeedbackQuestionMapping[props.usageTriggereeFeedbackID]}</b>. {questionOne}
                        </h3>
                        <p className='text-subtext-1'>
                            1 = Not useful
                        </p>
                        <p className='text-subtext-1 mb-5px'>
                            5 = Exactly what I wanted
                        </p>
                    </label>
                    <RadioButtons
                        values={['1', '2', '3', '4', '5']}
                        selectedValue={firstResponse}
                        onChange={(e) => setFirstResponse(e)}
                        highlight={submitted && firstResponse === ''}
                        orientation='horizontal'
                    />
                    <label>
                        <h3 className='text-body-1 mt-20px mb-5px'>
                            {questionTwo}
                        </h3>
                    </label>
                    <TextArea
                        value={secondResponse}
                        className={(submitted && secondResponse === '') ? 'border-red-important' : undefined}
                        placeholder='I could not figure out how to ...'
                        onChange={(e) => setSecondResponse(e.target.value)}
                        height='small'
                    />
                </div>
            }
            buttons = {
                <>
                    <TextButton
                        variant='dark'
                        width='small'
                        onClick={() => {
                            // Make sure it's filled out
                            if (firstResponse === '' || secondResponse === '') {
                                setSubmitted(true);
                                return;
                            }

                            void props.mitoAPI.updateFeedback(props.usageTriggereeFeedbackID, props.numUsages,
                                [
                                    {'question': questionOne, 'answer': firstResponse},
                                    {'question': questionTwo, 'answer': secondResponse}
                                ]
                            )

                            // And then close the modal
                            props.setUIState(prevUIState => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })
                        }} 
                    >
                        Submit
                    </TextButton>
                </>
            }
        />
    )
} 

export default FeedbackModal;