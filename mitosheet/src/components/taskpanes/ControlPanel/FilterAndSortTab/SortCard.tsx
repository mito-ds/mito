// Copyright (c) Mito

import React, { useState, useEffect } from 'react';
import MitoAPI from '../../../../jupyter/api';
import { classNames } from '../../../../utils/classNames';
import Col from '../../../spacing/Col';
import Row from '../../../spacing/Row';

import '../../../../../css/taskpanes/ControlPanel/SortCard.css';
import { ColumnID } from '../../../../types';

export enum SortDirection {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
    NONE = 'none'
}

type SortCardProps = {
    selectedSheetIndex: number;
    columnID: ColumnID;
    mitoAPI: MitoAPI;
}

/*
    A modal that allows a user to sort a column
*/

const SortCard = (props: SortCardProps): JSX.Element => {
    const [stepID, setStepID] = useState('');
    const [sortDirection, setSortDirection] = useState(SortDirection.NONE)

    const updateSortDirection = (newSortDirection: SortDirection): void => {
        // If the user toggled the button that was already selected, turn off the sort
        if (newSortDirection == sortDirection) {
            setSortDirection(SortDirection.NONE);
        } else {
            setSortDirection(newSortDirection);
        }
    }

    const sendSortUpdateMessage = async (): Promise<void> => {
        // Sort the columns if the sortDirection is not None
        if (sortDirection != SortDirection.NONE) {

            const newStepID = await props.mitoAPI.editSort(
                props.selectedSheetIndex,
                props.columnID,
                sortDirection,
                stepID,
            )

            setStepID(newStepID)
        }
    }

    useEffect(() => {
        void sendSortUpdateMessage();
    }, [sortDirection])


    // Determine css styling of sort buttons
    const ascendingButtonClass = sortDirection == SortDirection.ASCENDING ? 'sort-button-selected' : '';
    const descendingButtonClass = sortDirection == SortDirection.DESCENDING ? 'sort-button-selected' : '';

    return (        
        <Row justify='space-between' align='center'>
            {/* NOTE: the spacing in the Dtype card should be the same as the SortCard */}
            <Col span={4}>
                <p className='text-header-3'> 
                    Sort 
                </p>
            </Col>
            <Col offset={2} flex='1'>
                {/* Supress the top bottom margin, as it's a row inside a row */}
                <Row suppressTopBottomMargin>
                    <Col flex='1'>
                        <button 
                            className={classNames('sort-button', ascendingButtonClass)}
                            onClick={() => updateSortDirection(SortDirection.ASCENDING)}
                        > 
                                Ascending 
                        </button>
                    </Col>
                    <Col offset={1} flex='1'>
                        <button 
                            className={classNames('sort-button', descendingButtonClass)}
                            onClick={() => updateSortDirection(SortDirection.DESCENDING)}
                        >
                                    Descending 
                        </button>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default SortCard;