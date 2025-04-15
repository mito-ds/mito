/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';
import { MitoAPI } from '../../../../api/api';
import { ColumnID, GridState, SheetData } from '../../../../types';
import { isNumberDtype } from '../../../../utils/dtypes';
import { getColumnFormatDropdownItems, getFormatTitle } from '../../../../utils/format';
import Select from '../../../elements/Select';
import Col from '../../../layout/Col';
import Row from '../../../layout/Row';

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
    sheetData: SheetData | undefined,
    closeOpenEditingPopups: () => void
}): JSX.Element {
    const formatTypeTitle = getFormatTitle(props.sheetData?.dfFormat.columns[props.columnID])

    if (!isNumberDtype(props.columnDtype)) {
        return (<></>)
    } 
    
    return (  
        <> 
            <Row justify='space-between' align='center'>
                {/* NOTE: the spacing in the Format card should be the same as the SortCard & DtypeCard */}
                <Col span={6} title={FORMAT_DESCRIPTION}>
                    <p className='text-header-3' title=''> 
                        Num Type 
                    </p>
                </Col>
                <Col offset={2} flex='1'>
                    {isNumberDtype(props.columnDtype) &&
                        <Select
                            value={formatTypeTitle}
                        >
                            {getColumnFormatDropdownItems(props.gridState.sheetIndex, props.sheetData, [props.columnID], props.mitoAPI, props.closeOpenEditingPopups)}
                        </Select>
                    }
                    {!isNumberDtype(props.columnDtype) &&
                        <p className='text-header-3 text-align-right'>
                            {formatTypeTitle}
                        </p>
                    }
                </Col>
            </Row>
            
        </>
    );
}


export default FormatCard;
