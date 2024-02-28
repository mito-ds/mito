// Copyright (c) Mito

import React from 'react';
import "../../../../../css/taskpanes/DefaultTaskpane.css";
import { UIState } from '../../../types';
import { classNames } from '../../../utils/classNames';
import { TaskpaneType } from '../taskpanes';
import DefaultTaskpane from './DefaultTaskpane';
import DefaultTaskpaneBody from './DefaultTaskpaneBody';
import DefaultTaskpaneHeader from './DefaultTaskpaneHeader';

/*
    DefaultEmptyTaskpane is a convenient taskpane to display when the
    user tries to open a taskpane that needs data displayed. 

    It allows them to easily navigate to the import taskpane, which is
    nice UX!
*/
const DefaultEmptyTaskpane = (
    props: {
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        header?: string,
        message?: string,
        errorMessage?: boolean
        suppressImportLink?: boolean
    }): JSX.Element => {

    const openImportTaskpane = () => {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.IMPORT_FILES}
            }
        })
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState}>
            <DefaultTaskpaneHeader
                header={props.header !== undefined ? props.header : 'Import data first'}
                setUIState={props.setUIState}   
            />
            <DefaultTaskpaneBody>
                <p 
                    className={classNames('text-body-1', 'text-overflow-wrap', {'text-color-error': props.errorMessage})}
                    style={{whiteSpace:'pre-wrap'}} // So we handle new line and tabs correctly
                >
                    {props.message ? props.message : 'Before performing that action, you need to import data into Mito.'}
                    {props.suppressImportLink !== true && 
                        <>
                            {' '}<span className='text-body-1-link' onClick={openImportTaskpane}>Click here to import data.</span>
                        </>
                    }
                </p>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
};

export default DefaultEmptyTaskpane;
