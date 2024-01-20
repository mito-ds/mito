// Copyright (c) Mito

import { MitoAPI } from '../../../../api/api';
import React from 'react';
import { classNames } from '../../../../utils/classNames';
import Col from '../../../layout/Col';
import Row from '../../../layout/Row';

import '../../../../../css/taskpanes/ControlPanel/SortCard.css';
import { AnalysisData, ColumnID } from '../../../../types';
import useLiveUpdatingParams from '../../../../hooks/useLiveUpdatingParams';

export enum SortDirection {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
    NONE = 'none'
}

export interface SortParams {
    sheet_index: number,
    column_id: ColumnID,
    sort_direction: SortDirection,
}

type SortCardProps = {
    selectedSheetIndex: number;
    columnID: ColumnID;
    mitoAPI: MitoAPI;
    analysisData: AnalysisData
}

/*
    A modal that allows a user to sort a column
*/

const SortCard = (props: SortCardProps): JSX.Element => {
    const {params, setParams} = useLiveUpdatingParams<SortParams, SortParams>(undefined, 'sort', props.mitoAPI, props.analysisData, 0);

    const updateSortDirection = (newSortDirection: SortDirection): void => {
        setParams(prevSortParams => {
            // If the user toggled the button that was already selected, turn off the sort
            let finalSortDirection = newSortDirection
            if (prevSortParams && newSortDirection == prevSortParams.sort_direction) {
                finalSortDirection = SortDirection.NONE;
            } 
            return {
                sheet_index: props.selectedSheetIndex,
                column_id: props.columnID,
                sort_direction: finalSortDirection
            }
        })
    }

    // Determine css styling of sort buttons
    const ascendingButtonClass = params && params.sort_direction == SortDirection.ASCENDING ? 'sort-button-selected' : '';
    const descendingButtonClass = params && params.sort_direction == SortDirection.DESCENDING ? 'sort-button-selected' : '';

    return (        
        <Row justify='space-between' align='center'>
            {/* NOTE: the spacing in the Dtype card should be the same as the SortCard */}
            <Col span={6}>
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