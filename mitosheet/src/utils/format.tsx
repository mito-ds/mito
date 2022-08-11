import React from "react"
import MitoAPI from "../jupyter/api"
import DropdownItem from "../components/elements/DropdownItem"
import { getSelectedNumberSeriesColumnIDs } from "../components/endo/selectionUtils"
import { ColumnFormatType, ColumnID, NumberColumnFormatEnum, GridState, MitoSelection, SheetData } from "../types"
import DropdownCheckmark from '../components/icons/DropdownCheckmark'
import { isFloatDtype, isNumberDtype } from "./dtypes"
import { getDefaultDataframeFormat } from "../components/taskpanes/SetDataframeFormat/SetDataframeFormatTaskpane"
import { isValueNone } from "../components/taskpanes/ControlPanel/FilterAndSortTab/filter/utils"

export const FORMAT_DISABLED_MESSAGE = 'You must have at least one Number column selected to adjust the formatting.'


const formatNumber = (number: number, precision?: number): string  => {
    if (precision === undefined) {
        return number.toLocaleString("en-US");
    } else {
        return number.toLocaleString("en-US", {minimumFractionDigits: precision, maximumFractionDigits: precision});
    }
}


/*
    For a cell to be formatted as a number, the cell must only contain valid number symbols
    and be either a int or float column.
*/
export const displayCellAsNumber = (cellData: boolean | string | number, columnDtype: string): boolean => {
    // If the column is not a number series, then don't format the cell as a number
    if (!isNumberDtype(columnDtype)) {
        return false
    }

    if (typeof cellData === 'boolean') {
        return false
    } else if (typeof cellData === 'number') {
        return true
    } 

    return false;
}

/*
    Returns cellData formatted as a number with decimals if the cell only contains valid number symbols
    and the columnMitoType is a number_series. Otherwise, returns the unaltered cellData
*/
export const formatCellData = (cellData: boolean | string | number, columnDtype: string, columnFormat: ColumnFormatType | undefined): string => {

    // Deal with NaN up front. Always just display NaN
    if (isValueNone(cellData)) {
        return 'NaN';
    }

    // If we are not formatting the cell as a number, then just return the cellData as a string
    if (!displayCellAsNumber(cellData, columnDtype)) {
        return '' + cellData;
    }

    // Otherwise, this is a number, so attempt to format it as a number
    let number = cellData;
    if (typeof number !== 'number') { 
        try {
            number = Number(number);
        } catch {
            return '' + cellData;
        }
    }

    const type = columnFormat?.type;
    const precision = columnFormat?.precision;

    if (type === undefined) {
        /**
         * If the column format is undefined, then we apply some default formatting. Note that
         * this means that what you see in the mitosheet is different than what you see when you
         * print out a styled dataframe, but the net result is pretty good: users can easily
         * parse their data in the mitosheet.
         * 
         * Our defaults currently:
         * 1. Always show commas on numbers.
         * 2. Show 2 decimal places by default for float columns (and none for ints)
         */
        if (isFloatDtype(columnDtype)) {
            return formatNumber(number, precision === undefined ? 2 : precision);
        }
        return formatNumber(number, precision);
    } else if (type === NumberColumnFormatEnum.PLAIN_TEXT) {
        if (isFloatDtype(columnDtype)) {
            return formatNumber(number, precision === undefined ? 2 : precision).replace(/\,/g, ''); // Remove commas
        }
        return formatNumber(number, precision).replace(/\,/g, ''); // Remove commas

    } else if (type === NumberColumnFormatEnum.PERCENTAGE) {
        return number.toLocaleString("en-US", {style: 'percent', minimumFractionDigits: precision, maximumFractionDigits: precision})
    } else if (type === NumberColumnFormatEnum.CURRENCY) {
        return Number(cellData).toLocaleString("en-US", {style: "currency", currency: "USD", minimumFractionDigits: precision, maximumFractionDigits: precision})
    } else if (type === NumberColumnFormatEnum.ACCOUNTING) {
        return Number(cellData).toLocaleString("en-US", {style: "currency", currency: "USD", currencySign: "accounting", minimumFractionDigits: precision, maximumFractionDigits: precision})
    } else if (type === NumberColumnFormatEnum.K_M_B) {
        const number_abs = Math.abs(number)
        // TODO: make this work with precision
        if (number_abs >= 1000000000) {
            
            return (number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        } else if (number_abs >= 1000000) {
            return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (number_abs >= 995) {
            return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        } else {
            // We make anything less than ABS(995) displayed as 0k to match Excel formatting 
            return '0k';
        }
    } else if (type === NumberColumnFormatEnum.SCIENTIFIC_NOTATION) {
        return number.toExponential(precision);
    }

    return ''  + cellData;
}

/**
 * A helper function for increasing the precision of a column format.
 */
export const increasePrecision = (columnFormat: ColumnFormatType, columnDtype: string | undefined): ColumnFormatType => {
    if (columnDtype && isFloatDtype(columnDtype) && columnFormat.precision === undefined) {
        // If the column is a float column and the precision is undefined, then since we default to 2, increasing means bumping to 3
        return {...columnFormat, precision: 3}
    } else {
        return {...columnFormat, precision: (columnFormat.precision || 0) + 1}
    }
}

/**
 * A helper function for increasing the precision of a column format.
 */
export const decreasePrecision = (columnFormat: ColumnFormatType, columnDtype: string | undefined): ColumnFormatType => {
    if (columnDtype && isFloatDtype(columnDtype) && columnFormat.precision === undefined) {
        // If the column is a float column and the precision is undefined, then since we default to 2, increasing means dropping to 1
        return {...columnFormat, precision: 1}
    } else {
        return {...columnFormat, precision: Math.max((columnFormat.precision || 0) - 1, 0)}
    }
}

/* 
    Sends the changeColumnFormat message to the backend so that the format of the selected columns
    will be updated in the state.
*/
export const changeFormatOfSelectedColumns = async (
    sheetIndex: number,
    selections: MitoSelection[], 
    newColumnFormat: ColumnFormatType | undefined, 
    sheetData: SheetData | undefined,
    mitoAPI: MitoAPI
): Promise<void> => {
    
    const numberColumnIDsSelected = getSelectedNumberSeriesColumnIDs(selections, sheetData)
    const newDfFormat = {...(sheetData?.dfFormat || getDefaultDataframeFormat())}
    numberColumnIDsSelected.forEach(columnID => {
        newDfFormat.columns[columnID] = newColumnFormat
    })

    
    await mitoAPI.editSetDataframeFormat(
        sheetIndex,
        newDfFormat,
    )
}

/* 
    Change the format of a single columnID
*/
export const changeFormatOfColumnID = async (sheetIndex: number, sheetData: SheetData | undefined, columnID: string, newColumnFormat: ColumnFormatType | undefined, mitoAPI: MitoAPI): Promise<void> => {
    const newDfFormat = {...(sheetData?.dfFormat || getDefaultDataframeFormat())}
    newDfFormat.columns[columnID] = newColumnFormat

    await mitoAPI.editSetDataframeFormat(
        sheetIndex,
        newDfFormat,
    )
}


/* 
    Returns all of the format type DropdownItems where the method for checking which columns to apply the formating to 
    is based on the current selection. This is used to bulk format columns. 
*/
export const getColumnFormatDropdownItemsUsingSelections = (gridState: GridState, sheetData: SheetData | undefined, mitoAPI: MitoAPI): JSX.Element[] => {

    const onClick = (columnFormat: ColumnFormatType | undefined): void => {
        void changeFormatOfSelectedColumns(
            gridState.sheetIndex,
            gridState.selections,
            columnFormat,
            sheetData,
            mitoAPI
        )
    }

    const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData)
    const disabled = selectedNumberSeriesColumnIDs.length === 0

    // Get the format applied to the first selected column so we can display it in the dropdown
    const appliedFormatting = sheetData ? sheetData.dfFormat.columns[selectedNumberSeriesColumnIDs[0]] : undefined

    return _getColumnFormatDropdownItems(onClick, disabled, appliedFormatting) 
}

/*
    Returns all of the format type DropdownItems where we only apply the format to the passed column id. 
    This is used by the column control panel.
*/
export const getColumnFormatDropdownItemsUsingColumnID = (
    sheetIndex: number, 
    columnID: ColumnID, 
    mitoAPI: MitoAPI, 
    columnDtype: string, 
    sheetData: SheetData | undefined,
    skipDefaultFormatItem?: boolean  // If false, the DropdownItems returned won't include the Default Format Dropdown Item
): JSX.Element[] => {
    
    const onClick = (columnFormat: ColumnFormatType | undefined): void => {
        void changeFormatOfColumnID(
            sheetIndex, 
            sheetData,
            columnID, 
            columnFormat, 
            mitoAPI
        )
    }

    const disabled = !isNumberDtype(columnDtype);
    const appliedFormatting = sheetData?.dfFormat.columns[columnID];

    return _getColumnFormatDropdownItems(onClick, disabled, appliedFormatting, skipDefaultFormatItem) 
}

const _getColumnFormatDropdownItems = (
    onClick: (columnFormat: ColumnFormatType | undefined) => void, 
    disabled: boolean, 
    appliedColumnFormat: ColumnFormatType | undefined, 
    skipDefaultFormatItem?: boolean // If false, the DropdownItems returned won't include the Default Format Dropdown Item
): JSX.Element[] => {
    const formatDropdownItems = skipDefaultFormatItem === undefined || skipDefaultFormatItem ? [
        <DropdownItem 
            key='Default'
            title='Default'
            icon={appliedColumnFormat?.type === undefined ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick(undefined)}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : 'ints: 1,235, floats: 1,234.6'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />
    ] : [];
    
    const remainingFormatDropdownItems = [
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.PLAIN_TEXT})}
            title={getFormatTitle({type: NumberColumnFormatEnum.PLAIN_TEXT})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.PLAIN_TEXT ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.PLAIN_TEXT})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : 'ints: 1235, floats 1234.5678 (remove commas and display all decimals)'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.CURRENCY})}
            title={getFormatTitle({type: NumberColumnFormatEnum.CURRENCY})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.CURRENCY ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.CURRENCY})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : 'Numbers displayed as $1234.57'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.ACCOUNTING})}
            title={getFormatTitle({type: NumberColumnFormatEnum.ACCOUNTING})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.ACCOUNTING ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.ACCOUNTING})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : 'Negative numbers displayed as ($1234.57)'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.PERCENTAGE})}
            title={getFormatTitle({type: NumberColumnFormatEnum.PERCENTAGE})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.PERCENTAGE ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.PERCENTAGE})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '123,457.00%'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.K_M_B})}
            title={getFormatTitle({type: NumberColumnFormatEnum.K_M_B})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.K_M_B ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.K_M_B})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1.234K (numbers less than 995 are displayed as 0k)'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.SCIENTIFIC_NOTATION})}
            title={getFormatTitle({type: NumberColumnFormatEnum.SCIENTIFIC_NOTATION})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.SCIENTIFIC_NOTATION ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.SCIENTIFIC_NOTATION})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1.23e+3'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />
    ]

    return formatDropdownItems.concat(remainingFormatDropdownItems)
}

export const getFormatTitle = (formatTypeObj: ColumnFormatType | undefined): string => {
    if (formatTypeObj === undefined) {
        return 'Default'
    }

    switch(formatTypeObj.type) {
        case undefined :
            return 'Default';
        case NumberColumnFormatEnum.PLAIN_TEXT:
            return 'Plain Text'
        case NumberColumnFormatEnum.PERCENTAGE: {
            return 'Percentage'
        }
        case NumberColumnFormatEnum.CURRENCY: {
            return 'Currency'
        }
        case NumberColumnFormatEnum.ACCOUNTING: {
            return 'Accounting'
        }
        case NumberColumnFormatEnum.K_M_B: {
            return 'Use K, M, and B for large numbers'
        }
        case NumberColumnFormatEnum.SCIENTIFIC_NOTATION:
            return 'Scientific Notation'
    }
}