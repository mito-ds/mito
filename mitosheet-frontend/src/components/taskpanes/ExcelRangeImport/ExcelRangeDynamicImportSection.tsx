import React from "react";
import ExcelRangeDynamicCondition from "./ExcelRangeDynamicCondition";
import { ExcelRangeDynamicImport, ExcelRangeImportParams } from "./ExcelRangeImportTaskpane";
import Spacer from "../../layout/Spacer";


interface ExcelRangeDynamicSectionProps {
    rangeImport: ExcelRangeDynamicImport,
    index: number,
    setParams: React.Dispatch<React.SetStateAction<ExcelRangeImportParams>>
}
const ExcelRangeDynamicSection = (props: ExcelRangeDynamicSectionProps): JSX.Element => {

    const rangeImport = props.rangeImport;

    return (
        <>
            <ExcelRangeDynamicCondition
                title='Starting Row Condition'
                condition={rangeImport.start_condition}
                setCondition={(newCondition) => {
                    props.setParams((prevParams) => {
                        const newRangeImports = window.structuredClone(prevParams.range_imports);
                        const newRangeImport: ExcelRangeDynamicImport = window.structuredClone(rangeImport);
                        newRangeImport.start_condition = newCondition;
                        newRangeImports[props.index] = newRangeImport;
                        return {
                            ...prevParams,
                            range_imports: newRangeImports
                        }
                    })
                }}
                conditionOptions={{
                    'upper left corner value': {'title': 'Top Left Corner Value', 'subtext': 'Mito will search for this exact value (including whitespace).', 'placeholderValue': 'start value'},
                    'upper left corner value starts with': {'title': 'Top Left Corner Starts With', 'subtext': 'Mito will search for a cell that starts with this value.', 'placeholderValue': 'start value'},
                    'upper left corner value contains': {'title': 'Top Left Corner Contains', 'subtext': 'Mito will search for a cell that contains this value.', 'placeholderValue': 'start value'},
                }}
            />
            <Spacer px={10} seperatingLine/>
            <ExcelRangeDynamicCondition
                title='Ending Row Condition'
                condition={rangeImport.end_condition}
                setCondition={(newCondition) => {
                    props.setParams((prevParams) => {
                        const newRangeImports = window.structuredClone(prevParams.range_imports);
                        const newRangeImport: ExcelRangeDynamicImport = window.structuredClone(rangeImport);
                        newRangeImport.end_condition = newCondition;
                        newRangeImports[props.index] = newRangeImport;
                        return {
                            ...prevParams,
                            range_imports: newRangeImports
                        }
                    })
                }}
                conditionOptions={{
                    'first empty cell': {'title': 'First Empty Cell', 'subtext': 'Mito will take all rows until it hits an empty cell in the first column.'},
                    'bottom left corner value': {'title': 'Bottom Left Corner Value', 'subtext': 'Mito will take all rows until it finds this exact value (including whitespace) in the first column.', 'placeholderValue': 'end value'},
                    'bottom left corner value starts with': {'title': 'Bottom Left Corner Starts With', 'subtext': 'Mito will take all rows until it finds a cell that starts with this value in the first column.', 'placeholderValue': 'end value'},
                    'bottom left corner value contains': {'title': 'Bottom Left Corner Contains', 'subtext': 'Mito will take all rows until it finds a cell that contains with this value in the first column.', 'placeholderValue': 'end value'},
                    'bottom left corner consecutive empty cells': {'title': 'Number of Empty Cells in Row', 'subtext': 'Mito will take all rows until it finds a row with at least this number of empty cells.', 'placeholderValue': '4'},
                    'bottom left corner consecutive empty cells in first column': {'title': 'Consecutive Empty in Column', 'subtext': 'Mito will take all rows until the first column has this number of empty cells in a row.', 'placeholderValue': '4'},
                    'row entirely empty': {'title': 'Row Entirely Empty', 'subtext': 'Mito will take all rows unitl it finds a row where all the columns have empty values.'},
                    'cumulative number of empty rows': {'title': 'Cumulative # of Empty Rows', 'subtext': 'Mito will take all rows until it finds this number of empty rows. They do not need to be consecutive.', 'placeholderValue': '4'},
                    'consecutive number of empty rows': {'title': 'Consecutive # of Empty Rows', 'subtext': 'Mito will take all rows until it finds this number of consecutive empty rows.', 'placeholderValue': '4'},
                }}
            />
            <Spacer px={10} seperatingLine/>
            <ExcelRangeDynamicCondition
                title='Ending Column Condition'
                condition={rangeImport.column_end_condition}
                setCondition={(newCondition) => {
                    props.setParams((prevParams) => {
                        const newRangeImports = window.structuredClone(prevParams.range_imports);
                        const newRangeImport: ExcelRangeDynamicImport = window.structuredClone(rangeImport);
                        newRangeImport.column_end_condition = newCondition;
                        newRangeImports[props.index] = newRangeImport;
                        return {
                            ...prevParams,
                            range_imports: newRangeImports
                        }
                    })
                }}
                conditionOptions={{
                    'first empty cell': {'title': 'First Empty Cell', 'subtext': 'Mito will continue take all columns until it hits an empty cell in the first row.'},
                    'num columns': {'title': 'Number of Columns', 'subtext': 'Mito will take this number of columns.', 'placeholderValue': '4'},
                }}
            />
        </>
    )
}

export default ExcelRangeDynamicSection;