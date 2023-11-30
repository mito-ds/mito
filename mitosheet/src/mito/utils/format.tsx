import React from "react"
import { MitoAPI } from "../api/api"
import DropdownItem from "../components/elements/DropdownItem"
import { getNumberColumnIDs } from "../components/endo/selectionUtils"
import { ColumnFormatType, ColumnID, NumberColumnFormatEnum, SheetData } from "../types"
import DropdownCheckmark from '../components/icons/DropdownCheckmark'
import { isFloatDtype, isIntDtype } from "./dtypes"
import { getDefaultDataframeFormat } from "../pro/taskpanes/SetDataframeFormat/SetDataframeFormatTaskpane"
import DropdownSectionSeperator from "../components/elements/DropdownSectionSeperator"

export const FORMAT_DISABLED_MESSAGE = 'You must have at least one number column selected to adjust the formatting.'

// Formats a number with commas and a specific number of decimals specified by precision
const formatNumber = (number: number, precision?: number): string  => {
    return number.toLocaleString("en-US", {minimumFractionDigits: precision, maximumFractionDigits: precision});
}

/*
    Returns cellData formatted as a number with decimals if the cell only contains valid number symbols
    and the columnMitoType is a number_series. Otherwise, returns the unaltered cellData
*/
export const formatCellData = (cellData: boolean | string | number, columnDtype: string, columnFormat: ColumnFormatType | undefined): string => {

    // If we are not formatting a number, then just return the cellData as a string
    // Otherwise, this is a number, so attempt to format it as a number
    if (typeof cellData !== 'number') {
        return '' + cellData;
    }
    
    const type = columnFormat?.type;
    let precision = columnFormat?.precision;

    // Show 2 decimal places by default for float columns (and none for ints)
    if (precision === undefined) {
        if (isFloatDtype(columnDtype)) {precision = 2}
        if (isIntDtype(columnDtype)) {precision = 0}
    }

    // We do not allow precision to be greater than 20, as this is the maximum number for minimumFractionDigits before it will crash
    if ((precision || 0) > 20) {
        precision = 20;
    }

    switch (type) {
        case undefined: {
            /**
             * If the column format is undefined, then we apply some default formatting. Note that
             * this means that what you see in the mitosheet is different than what you see when you
             * print out a styled dataframe, but the net result is pretty good: users can easily
             * parse their data in the mitosheet. Our defaults are just a default number of decimal
             * places, and commas on numbers.
             */
            return formatNumber(cellData, precision);
        }
        case NumberColumnFormatEnum.PLAIN_TEXT:
            return formatNumber(cellData, precision).replace(/,/g, '');
        case NumberColumnFormatEnum.PERCENTAGE:
            return cellData.toLocaleString("en-US", {style: 'percent', minimumFractionDigits: precision, maximumFractionDigits: precision})
        case NumberColumnFormatEnum.CURRENCY:
            return cellData.toLocaleString("en-US", {style: "currency", currency: "USD", minimumFractionDigits: precision, maximumFractionDigits: precision})
        case NumberColumnFormatEnum.ACCOUNTING:
            return cellData.toLocaleString("en-US", {style: "currency", currency: "USD", currencySign: "accounting", minimumFractionDigits: precision, maximumFractionDigits: precision})
        case NumberColumnFormatEnum.SCIENTIFIC_NOTATION:
            return cellData.toExponential(precision);
    }
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
 * A helper function for decreasing the precision of a column format.
 */
export const decreasePrecision = (columnFormat: ColumnFormatType, columnDtype: string | undefined): ColumnFormatType => {
    if (columnDtype && isFloatDtype(columnDtype) && columnFormat.precision === undefined) {
        // If the column is a float column and the precision is undefined, then since we default to 2, increasing means dropping to 1
        return {...columnFormat, precision: 1}
    } else {
        return {...columnFormat, precision: Math.max((columnFormat.precision || 0) - 1, 0)}
    }
}

/**
 * A helper function that actually changes the format of the passed column ids to the new format.
 */
export const changeFormatOfColumns = async (
    sheetIndex: number,
    sheetData: SheetData | undefined,
    columnIDs: ColumnID[], 
    newColumnFormat: ColumnFormatType | undefined, 
    mitoAPI: MitoAPI
): Promise<void> => {
    
    const newDfFormat = {...(sheetData?.dfFormat || getDefaultDataframeFormat())}
    columnIDs.forEach(columnID => {
        if (newColumnFormat === undefined) {
            newDfFormat.columns[columnID] = newColumnFormat;
        } else {
            const existingColumnFormat: ColumnFormatType = newDfFormat.columns[columnID] || {};
            newDfFormat.columns[columnID] = {...existingColumnFormat, ...newColumnFormat}
        }
    })
    
    await mitoAPI.editSetDataframeFormat(
        sheetIndex,
        newDfFormat,
    )
}

/**
 * Returns the number format applied to the currently selected column.
 * If there is no number format applied, then returns undefined.
 */
export const getColumnAppliedFormat = (
    sheetData: SheetData | undefined,
    columnIDs: ColumnID[]
) => {
    const numberColumnColumnIDs = getNumberColumnIDs(sheetData, columnIDs);
    const appliedFormatting = sheetData?.dfFormat.columns[numberColumnColumnIDs[0]];
    return getFormatTitle(appliedFormatting);
}

/*
    Returns all of the format type DropdownItems where we only apply the format to the passed column id. 
    This is used by the column control panel.
*/
export const getColumnFormatDropdownItems = (
    sheetIndex: number, 
    sheetData: SheetData | undefined,
    columnIDs: ColumnID[], 
    mitoAPI: MitoAPI, 
    closeOpenEditingPopups: () => void
): JSX.Element[] => {

    const numberColumnColumnIDs = getNumberColumnIDs(sheetData, columnIDs);
    const appliedFormatting = sheetData?.dfFormat.columns[numberColumnColumnIDs[0]];

    const onClick = (columnFormat: ColumnFormatType | undefined): void => {
        // Close any open editing taskpanes
        closeOpenEditingPopups()

        void changeFormatOfColumns(
            sheetIndex, 
            sheetData,
            columnIDs, 
            columnFormat, 
            mitoAPI
        )
    }

    return _getColumnFormatDropdownItems(onClick, numberColumnColumnIDs.length === 0, appliedFormatting) 
}

const _getColumnFormatDropdownItems = (
    onClick: (columnFormat: ColumnFormatType | undefined) => void, 
    disabled: boolean, 
    appliedColumnFormat: ColumnFormatType | undefined, 
): JSX.Element[] => {
    return [
        <DropdownItem 
            key='Default'
            title='Default'
            icon={appliedColumnFormat?.type === undefined ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: undefined})}
            rightText='1,234.6'
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.PLAIN_TEXT})}
            title={getFormatTitle({type: NumberColumnFormatEnum.PLAIN_TEXT})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.PLAIN_TEXT ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.PLAIN_TEXT})}
            rightText='1234.6'
            disabled={disabled}
        />,
        <DropdownSectionSeperator isDropdownSectionSeperator key='sep'/>,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.CURRENCY})}
            title={getFormatTitle({type: NumberColumnFormatEnum.CURRENCY})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.CURRENCY ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.CURRENCY})}
            rightText='$-1,234.57'
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.ACCOUNTING})}
            title={getFormatTitle({type: NumberColumnFormatEnum.ACCOUNTING})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.ACCOUNTING ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.ACCOUNTING})}
            rightText='($1,234.57)'
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.PERCENTAGE})}
            title={getFormatTitle({type: NumberColumnFormatEnum.PERCENTAGE})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.PERCENTAGE ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.PERCENTAGE})}
            rightText='123,457.00%'
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: NumberColumnFormatEnum.SCIENTIFIC_NOTATION})}
            title={getFormatTitle({type: NumberColumnFormatEnum.SCIENTIFIC_NOTATION})}
            icon={appliedColumnFormat?.type === NumberColumnFormatEnum.SCIENTIFIC_NOTATION ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: NumberColumnFormatEnum.SCIENTIFIC_NOTATION})}
            rightText={'1.23e+3'}
            disabled={disabled}
        />
    ];
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
        case NumberColumnFormatEnum.SCIENTIFIC_NOTATION:
            return 'Scientific Notation'
    }
}