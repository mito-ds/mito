// Copyright (c) Mito

import React, { useState, useEffect } from 'react';
import MitoAPI from '../../../../api';
import "../../../../../css/taskpanes/ControlPanel/ColumnSummaryStatistics.css"


type ColumnDescribeChartProps = {
    selectedSheetIndex: number;
    columnID: string;
    mitoAPI: MitoAPI;
}

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
            props.selectedSheetIndex, 
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
                            return (
                                <tr className='column-describe-table-row' key={key}>
                                    <th>
                                        {key}
                                    </th>
                                    <th>
                                        {/* We clip data at 15 letters for now */}
                                        {describe[key].substring(0, 15) + (describe[key].length > 15 ? '...' : '')}
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