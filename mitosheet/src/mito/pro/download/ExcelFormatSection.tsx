import React from "react";
import MitoAPI from "../../api/api";
import { ExcelExportState, SheetData } from "../../../types";

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
            Excel formatting export coming soon!
        </>
    )
}

export default ExcelFormatSection;

