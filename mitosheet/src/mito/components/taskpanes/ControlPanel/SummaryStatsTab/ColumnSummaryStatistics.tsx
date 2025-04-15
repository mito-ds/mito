/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';
import "../../../../../../css/taskpanes/ControlPanel/ColumnSummaryStatistics.css";
import { MitoAPI } from '../../../../api/api';
import { useStateFromAPIAsync } from '../../../../hooks/useStateFromAPIAsync';
import { ColumnFormatType, ColumnID, UIState } from '../../../../types';
import { formatCellData } from '../../../../utils/format';
import OpenFillNaN from '../../FillNa/OpenFillNaN';


type ColumnDescribeChartProps = {
    selectedSheetIndex: number;
    columnID: ColumnID;
    mitoAPI: MitoAPI;
    columnFormat: ColumnFormatType | undefined;
    columnDtype: string;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

const KEY_TO_FORMAT_WITH_COLUMN_FORMAT = [
    'mean',
    'std',
    'min',
    '25%',
    '50%',
    '75%',
    'max',
    'median',
    'sum'
]

/*
    Displays the column summary statistics gotten from 
    a call to .describe

    See examples here: https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.Series.describe.html
*/
function ColumnSummaryStatistics(props: ColumnDescribeChartProps): JSX.Element {

    const [describe, loading] = useStateFromAPIAsync<Record<string, string>, undefined>(
        {},
        async () => {
            const response = await props.mitoAPI.getColumnDescribe(
                props.selectedSheetIndex, 
                props.columnID
            );
            return 'error' in response ? undefined : response.result;
        },
        undefined,
        []
    )

    return (
        <React.Fragment>
            <div className='text-header-3'>
                <p> Column Summary Statistics </p>
            </div>
            <div key={loading.toString()}>
                {!loading &&
                    <table className='column-describe-table-container'>
                        {Object.keys(describe).map(key => {
                            const value = describe[key];
                            let valueToDisplay = value;
                            
                            // Add the format, if there is one for this column
                            if (KEY_TO_FORMAT_WITH_COLUMN_FORMAT.includes(key)) {
                                valueToDisplay = formatCellData(value, props.columnDtype, props.columnFormat)
                            } 

                            // We clip data at 15 letters for now. We also format
                            valueToDisplay = valueToDisplay.substring(0, 15) + (valueToDisplay.length > 15 ? '...' : '')

                            return (
                                <tr className='column-describe-table-row' key={key}>
                                    <th>
                                        {key} 
                                        {key === 'count: NaN' && valueToDisplay !== "0" && 
                                            <OpenFillNaN
                                                setUIState={props.setUIState}
                                                columnID={props.columnID}
                                            />
                                        }
                                    </th>
                                    <th title={value}>
                                        {valueToDisplay}
                                    </th>
                                </tr>
                            )
                        })}
                    </table> 
                }
                {loading && 
                    <p>
                        Column Summary statistics are loading...
                    </p>
                }
            </div>
            
        </React.Fragment>
    );
}


export default ColumnSummaryStatistics;