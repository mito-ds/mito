// Copyright (c) Mito

import React, { useState, useEffect } from 'react';
import MitoAPI from '../../../../api';
import "../../../../../css/taskpanes/ControlPanel/ColumnSummaryStatistics.css"
import { ColumnID, DataframeID, FormatTypeObj } from '../../../../types';
import { formatCellData } from '../../../../utils/formatColumns';


type ColumnDescribeChartProps = {
    selectedDataframeID: DataframeID;
    columnID: ColumnID;
    mitoAPI: MitoAPI;
    columnFormatType: FormatTypeObj;
    columnDtype: string;
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
    const [describe, setDescribe] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true)

    async function loadDescribe() {
        const loadedDescribe = await props.mitoAPI.getColumnDescribe(
            props.selectedDataframeID, 
            props.columnID
        );
        setDescribe(loadedDescribe);
        setLoading(false);
    }

    useEffect(() => {
        void loadDescribe();
    }, [])

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
                                valueToDisplay = formatCellData(value, props.columnDtype, props.columnFormatType)
                            } 

                            // We clip data at 15 letters for now. We also format
                            valueToDisplay = valueToDisplay.substring(0, 15) + (valueToDisplay.length > 15 ? '...' : '')

                            return (
                                <tr className='column-describe-table-row' key={key}>
                                    <th>
                                        {key}
                                    </th>
                                    <th>
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