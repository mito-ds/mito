import React from "react";
import MitoAPI from "../../jupyter/api";
import { ExcelExportState, SheetData } from "../../components/../types";

const ExcelFormatSection = (props: {
    dfNames: string[]
    mitoAPI: MitoAPI
    sheetDataArray: SheetData[]
    exportState: ExcelExportState;
    newlyFormattedColumns: Record<number, string[]>
    setNewlyFormattedColumns: React.Dispatch<React.SetStateAction<Record<number, string[]>>>
}): JSX.Element => {

    // So the linter is happy
    props;

    return (
        <>
            TODO: add Excel formatting
        </>
    )
}

export default ExcelFormatSection;

