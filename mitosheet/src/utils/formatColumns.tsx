import React from "react"
import MitoAPI from "../api"
import DropdownItem from "../components/elements/DropdownItem"
import { getSelectedNumberSeriesColumnIDs } from "../components/endo/selectionUtils"
import { FormatType, FormatTypeObj, GridState, MitoSelection, SheetData } from "../types"
import DropdownCheckmark from '../components/icons/DropdownCheckmark'
import { isNumberDtype } from "./dtypes"

export const FORMAT_DISABLED_MESSAGE = 'You must have at least one Number column selected to adjust the formatting.'

const formatCellDataAsStringWithCommas = (cellData: string | number | boolean, decimalPlaces: 0 | 1): string => {
    return Number(cellData).toLocaleString("en-US", {minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces})
}

/*
    For a cell to be formatted as a number, the cell must only contain valid number symbols
    and be either a int or float column. 

    Note: The cellData type of a float is a string.
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
    } else {
        return isStringNumeric(cellData)
    }
}

/*
    Determines if a string is a number
    Adapted from: https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
    Note: This won't format numbers that have non . separators correctly, but that's okay for now because we wouldn't want to switch them to decimals
*/
export const isStringNumeric = (str: string): boolean => {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str as unknown as number) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

/*
    Returns cellData formatted as a number with decimals if the cell only contains valid number symbols
    and the columnMitoType is a number_series. Otherwise, returns the unaltered cellData
*/
export const formatCellData = (cellData: boolean | string | number, columnDtype: string, columnFormatType: FormatTypeObj): string => {
    // Wrap in a try, catch because there are lots of type cases and we'd rather be safe than sorry.
    try {
        if (displayCellAsNumber(cellData, columnDtype)) {
            switch(columnFormatType.type) {
                case FormatType.DEFAULT:
                    if (columnDtype?.includes('int')) {
                        // If the column is an int, default to 0 decimal places
                        return formatCellDataAsStringWithCommas(cellData, 0)
                    } else {
                        // If the column is a float, default to 2 decimal places
                        return formatCellDataAsStringWithCommas(cellData, 1)
                    }
                case FormatType.PLAIN_TEXT:
                    return '' + cellData
                case FormatType.ROUND_DECIMALS: {
                    const numDecimals = columnFormatType.numDecimals
                    return Number(cellData).toLocaleString("en-US", {minimumFractionDigits: numDecimals, maximumFractionDigits: numDecimals})
                }
                case FormatType.PERCENTAGE: {
                    return Number(cellData).toLocaleString("en-US", {style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2})
                }
                case FormatType.ACCOUNTING: {
                    return Number(cellData).toLocaleString("en-US", {style: "currency", currency: "USD", currencySign: "accounting"})
                }
                case FormatType.K_M_B: {
                    // Ensure we're operating on a number.
                    const number = Number.parseFloat(String(cellData))
                    const number_abs = Math.abs(number)
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
                }
                case FormatType.SCIENTIFIC_NOTATION:
                    return Number.parseFloat(String(cellData)).toExponential(2);
            }
        } else {
            return '' + cellData
        }
    } catch {
        return '' + cellData 
    }
    
}

/* 
    Sends the changeColumnFormat message to the backend so that the format of the selected columns
    will be updated in the state.
*/
export const changeFormatOfSelectedColumns = async (
    sheetIndex: number,
    selections: MitoSelection[], 
    newFormatTypeObj: FormatTypeObj, 
    sheetData: SheetData | undefined,
    mitoAPI: MitoAPI
): Promise<void> => {
    
    const numberColumnIDsSelected = getSelectedNumberSeriesColumnIDs(selections, sheetData)
    
    await mitoAPI.changeColumnFormat(
        sheetIndex,
        numberColumnIDsSelected,
        newFormatTypeObj
    )
}

/* 
    Change the format of a single columnID
*/
export const changeFormatOfColumnID = async (sheetIndex: number, columnID: string, newFormatTypeObj: FormatTypeObj, mitoAPI: MitoAPI): Promise<void> => {
    await mitoAPI.changeColumnFormat(
        sheetIndex,
        [columnID],
        newFormatTypeObj
    )
}


/* 
    Returns all of the format type DropdownItems where the method for checking which columns to apply the formating to 
    is based on the current selection. This is used to bulk format columns. 
*/
export const getColumnFormatDropdownItemsUsingSelections = (gridState: GridState, sheetData: SheetData | undefined, mitoAPI: MitoAPI): JSX.Element[] => {

    const onClick = (formatTypeObject: FormatTypeObj): void => {
        void changeFormatOfSelectedColumns(
            gridState.sheetIndex,
            gridState.selections,
            formatTypeObject,
            sheetData,
            mitoAPI
        )
    }

    const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData)
    const disabled = selectedNumberSeriesColumnIDs.length === 0

    // Get the format applied to the first selected column so we can display it in the dropdown
    const appliedFormatting = sheetData ? sheetData.columnFormatTypeObjMap[selectedNumberSeriesColumnIDs[0]] : undefined

    return _getColumnFormatDropdownItems(onClick, disabled, appliedFormatting) 
}

/*
    Returns all of the format type DropdownItems where we only apply the format to the passed column id. 
    This is used by the column control panel.
*/
export const getColumnFormatDropdownItemsUsingColumnID = (
    sheetIndex: number, 
    columnID: string, 
    mitoAPI: MitoAPI, 
    columnDtype: string, 
    sheetData: SheetData | undefined,
    skipDefaultFormatItem?: boolean  // If false, the DropdownItems returned won't include the Default Format Dropdown Item
): JSX.Element[] => {
    
    const onClick = (formatTypeObject: FormatTypeObj): void => {
        void changeFormatOfColumnID(
            sheetIndex, 
            columnID, 
            formatTypeObject, 
            mitoAPI
        )
    }

    const disabled = !isNumberDtype(columnDtype);
    const appliedFormatting = sheetData ? sheetData.columnFormatTypeObjMap[columnID] : undefined

    return _getColumnFormatDropdownItems(onClick, disabled, appliedFormatting, skipDefaultFormatItem) 
}

const _getColumnFormatDropdownItems = (
    onClick: (fto: FormatTypeObj) => void, 
    disabled: boolean, 
    appliedFormat?: FormatTypeObj, 
    skipDefaultFormatItem?: boolean // If false, the DropdownItems returned won't include the Default Format Dropdown Item
): JSX.Element[] => {
    const formatDropdownItems = skipDefaultFormatItem === undefined || skipDefaultFormatItem ? [
        <DropdownItem 
            key={getFormatTitle({type: FormatType.DEFAULT})}
            title={getFormatTitle({type: FormatType.DEFAULT})}
            icon={appliedFormat?.type === FormatType.DEFAULT ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.DEFAULT})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : 'ints: 1,235, floats: 1,234.6'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />
    ] : []
    
    const remainingFormatDropdownItems = [
        <DropdownItem 
            key={getFormatTitle({type: FormatType.PLAIN_TEXT})}
            title={getFormatTitle({type: FormatType.PLAIN_TEXT})}
            icon={appliedFormat?.type === FormatType.PLAIN_TEXT ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.PLAIN_TEXT})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : 'ints: 1235, floats 1234.5678 (remove commas and display all decimals)'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.ACCOUNTING})}
            title={getFormatTitle({type: FormatType.ACCOUNTING})}
            icon={appliedFormat?.type === FormatType.ACCOUNTING ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.ACCOUNTING})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : 'Negative numbers displayed as ($1234.57)'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 0})}
            title={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 0})}
            icon={appliedFormat?.type === FormatType.ROUND_DECIMALS && appliedFormat?.numDecimals === 0 ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.ROUND_DECIMALS, numDecimals: 0})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1,235'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 1})}
            title={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 1})}
            icon={appliedFormat?.type === FormatType.ROUND_DECIMALS && appliedFormat?.numDecimals === 1 ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.ROUND_DECIMALS, numDecimals: 1})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1,234.6'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 2})}
            title={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 2})}
            icon={appliedFormat?.type === FormatType.ROUND_DECIMALS && appliedFormat?.numDecimals === 2 ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.ROUND_DECIMALS, numDecimals: 2})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1,234.57'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 3})}
            title={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 3})}
            icon={appliedFormat?.type === FormatType.ROUND_DECIMALS && appliedFormat?.numDecimals === 3 ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.ROUND_DECIMALS, numDecimals: 3})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1,234.568'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 4})}
            title={getFormatTitle({type: FormatType.ROUND_DECIMALS, numDecimals: 4})}
            icon={appliedFormat?.type === FormatType.ROUND_DECIMALS && appliedFormat?.numDecimals === 4 ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.ROUND_DECIMALS, numDecimals: 4})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1,234.5678'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.PERCENTAGE})}
            title={getFormatTitle({type: FormatType.PERCENTAGE})}
            icon={appliedFormat?.type === FormatType.PERCENTAGE ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.PERCENTAGE})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '123,457.00%'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.K_M_B})}
            title={getFormatTitle({type: FormatType.K_M_B})}
            icon={appliedFormat?.type === FormatType.K_M_B ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.K_M_B})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1.234K (numbers less than 995 are displayed as 0k)'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />,
        <DropdownItem 
            key={getFormatTitle({type: FormatType.SCIENTIFIC_NOTATION})}
            title={getFormatTitle({type: FormatType.SCIENTIFIC_NOTATION})}
            icon={appliedFormat?.type === FormatType.SCIENTIFIC_NOTATION ? <DropdownCheckmark /> : undefined}
            onClick={() => onClick({type: FormatType.SCIENTIFIC_NOTATION})}
            subtext={disabled ? FORMAT_DISABLED_MESSAGE : '1.23e+3'}
            hideSubtext={true}
            displaySubtextOnHover={true}
            disabled={disabled}
        />
    ]

    return formatDropdownItems.concat(remainingFormatDropdownItems)
}

export const getFormatTitle = (formatTypeObj: FormatTypeObj | undefined): string => {
    if (formatTypeObj === undefined) {
        return 'Default'
    }

    switch(formatTypeObj.type) {
        case FormatType.DEFAULT:
            return 'Default'
        case FormatType.PLAIN_TEXT:
            return 'Plain Text'
        case FormatType.ROUND_DECIMALS: {
            const plural = formatTypeObj.numDecimals != 1 ? 's' : ''
            return `${formatTypeObj.numDecimals} decimal place${plural}`
        }
        case FormatType.PERCENTAGE: {
            return 'Percentage'
        }
        case FormatType.ACCOUNTING: {
            return 'Accounting'
        }
        case FormatType.K_M_B: {
            return 'Use K, M, and B for large numbers'
        }
        case FormatType.SCIENTIFIC_NOTATION:
            return 'Scientific Notation'
    }
}
