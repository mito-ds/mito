import React from 'react';
import { SheetData } from '../../types';


/**
 * 
 * A wrapper around divs to displayed centered in the grid
 * 
 * @param props - the children you want to display in the center of the grid
 */
const GridDataEmptyContainer = (props: {children: React.ReactNode}): JSX.Element => {
    return (
        <div className='endo-grid-empty-container'>
            <div className='endo-grid-empty-text-container'>
                {props.children}
            </div>
        </div>
    )
}

const EmptyGridMessages = (props: {sheetData: SheetData | undefined}): JSX.Element => {

    return (
        <>
            {props.sheetData === undefined &&
                <GridDataEmptyContainer>
                    <p className='text-body-1'>
                        You have not imported any data into Mito yet.
                    </p>
                    <p className='text-body-1'>
                        Pass a dataframe to the mitosheet.sheet call, or use the Import button in the toolbar above.
                    </p>
                </GridDataEmptyContainer>
            }
            {props.sheetData !== undefined && props.sheetData.numRows === 0 && props.sheetData.numColumns === 0 &&
                <GridDataEmptyContainer>
                    <p className='text-body-1'>
                        No data in dataframe.
                    </p>
                </GridDataEmptyContainer>
            }
            {props.sheetData !== undefined && props.sheetData.numRows > 0 && props.sheetData.numColumns === 0 &&
                <GridDataEmptyContainer>
                    <p className='text-body-1'>
                        No columns in dataframe.
                    </p>
                </GridDataEmptyContainer>
            }
            {props.sheetData !== undefined && props.sheetData.numRows === 0 && props.sheetData.numColumns > 0 &&
                <GridDataEmptyContainer>
                    <p className='text-body-1'>
                        No rows in dataframe.
                    </p>
                </GridDataEmptyContainer>
            }
        </>
    )
}


export default EmptyGridMessages;