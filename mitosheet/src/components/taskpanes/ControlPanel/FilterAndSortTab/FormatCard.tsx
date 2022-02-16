// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../../api';
import { ColumnID, GridState, SheetData } from '../../../../types';
import { isNumberDtype } from '../../../../utils/dtypes';
import { getColumnFormatDropdownItemsUsingColumnID, getFormatTitle } from '../../../../utils/formatColumns';
import Select from '../../../elements/Select';
import Col from '../../../spacing/Col';
import Row from '../../../spacing/Row';

// Displayed if the user hovers over this section
const FORMAT_DESCRIPTION = 'Format the selected column as a percent, choose the number of decimals, etc. This only changes the display of the column, and does not effect the underlying dataframe.'

/*
    A card that allows a user to change
    the format of a column
*/
function FormatCard(props: {
    columnID: ColumnID
    gridState: GridState,
    mitoAPI: MitoAPI,
    columnDtype: string
    sheetData: SheetData | undefined 
}): JSX.Element {
    const formatTypeTitle = getFormatTitle(props.sheetData?.columnFormatTypeObjMap[props.columnID])
    
    return (  
        <> 
            <Row justify='space-between' align='center'>
                {/* NOTE: the spacing in the Format card should be the same as the SortCard & DtypeCard */}
                <Col span={4} title={FORMAT_DESCRIPTION}>
                    <p className='text-header-3' title=''> 
                        Format 
                    </p>
                </Col>
                <Col offset={2} flex='1'>
                    {isNumberDtype(props.columnDtype) &&
                        <Select
                            value={formatTypeTitle}
                        >
                            {getColumnFormatDropdownItemsUsingColumnID(props.gridState.sheetIndex, props.columnID, props.mitoAPI, props.columnDtype, props.sheetData)}
                        </Select>
                    }
                    {!isNumberDtype(props.columnDtype) &&
                        <p className='text-header-3 text-align-right'>
                            {formatTypeTitle}
                        </p>
                    }
                </Col>
            </Row>
            {!isNumberDtype(props.columnDtype) &&
                <Row>
                    <Col>
                        <p className='text-subtext-1'>
                            Mito only supports formatting columns with dtype int or float.
                        </p>
                    </Col>
                </Row>
            }
        </>
    );
}


export default FormatCard;
