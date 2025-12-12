import { ColumnMetadata } from "./MitoViewer";

/**
 * Interface for parsed numeric value parts used for decimal point alignment.
 */
export interface ParsedNumericValue {
    integerPart: string;
    decimalPart: string;
    hasDecimal: boolean;
}

/**
 * Calculates the maximum number of decimal places for each numeric column.
 * This is used to align decimal points across all numbers in a column.
 *
 * @param data - 2D array of cell values
 * @param columns - Array of column metadata
 * @returns Array of maximum decimal places per column
 */
export function calculateMaxDecimalPlaces(
    data: any[][],
    columns: ColumnMetadata[]
): number[] {
    const isNumeric = columns.map(
        (col) => col.dtype.includes("int") || col.dtype.includes("float")
    );
    const maxDecimals = new Array(columns.length).fill(0);

    data.forEach((row) => {
        row.forEach((cell, cellIndex) => {
            if (isNumeric[cellIndex] && cell != null) {
                const cellStr = String(cell);
                const decimalIndex = cellStr.indexOf(".");
                if (decimalIndex !== -1) {
                    const decimalPlaces = cellStr.length - decimalIndex - 1;
                    maxDecimals[cellIndex] = Math.max(
                        maxDecimals[cellIndex],
                        decimalPlaces
                    );
                }
            }
        });
    });

    return maxDecimals;
}

/**
 * Parses a numeric value into integer and decimal parts for decimal point alignment.
 * Returns null if the value is not numeric or should be displayed as-is.
 *
 * @param value - The cell value to parse
 * @param cellIndex - Index of the column
 * @param columns - Array of column metadata
 * @returns Parsed numeric value parts or null if not numeric
 */
export function parseNumericValue(
    value: any,
    cellIndex: number,
    columns: ColumnMetadata[]
): ParsedNumericValue | null {
    // Check if this is a numeric column
    const isNumeric =
        columns[cellIndex]?.dtype.includes("int") ||
        columns[cellIndex]?.dtype.includes("float");

    if (!isNumeric) return null;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    const valueStr = String(value);
    const decimalIndex = valueStr.indexOf(".");

    if (decimalIndex === -1) {
        // No decimal point
        return {
            integerPart: valueStr,
            decimalPart: "",
            hasDecimal: false,
        };
    }

    return {
        integerPart: valueStr.substring(0, decimalIndex),
        decimalPart: valueStr.substring(decimalIndex + 1),
        hasDecimal: true,
    };
}

/**
 * Formats a cell value for display, converting booleans to "True"/"False" strings.
 * Handles null/undefined values and ensures all values are properly stringified.
 *
 * @param value - The cell value to format
 * @returns Formatted string representation of the value
 */
export function formatCellValue(value: any): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "boolean") {
        return value ? "True" : "False";
    }
    return String(value);
}

