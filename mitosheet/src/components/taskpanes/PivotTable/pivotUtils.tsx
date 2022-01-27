import { AggregationType } from "./PivotTaskpane";


/* 
    A helper function for turning a record of values to an array, 
    which makes it much easier to work with in the pivot table 
    itself.
*/
export const valuesRecordToArray = (valuesRecord: Record<string, AggregationType[]>): [string, AggregationType][] => {
    const valuesArray: [string, AggregationType][] = [];

    Object.keys(valuesRecord).forEach(columnHeader => {
        valuesRecord[columnHeader].forEach(aggregationType => {
            valuesArray.push([columnHeader, aggregationType])
        })
    })

    return valuesArray;
}

/* 
    A helper function for turning a array of values to an record, 
    which is what the backend expects
*/
export const valuesArrayToRecord = (valuesArray: [string, AggregationType][]): Record<string, AggregationType[]> => {
    const valuesRecord: Record<string, AggregationType[]> = {};

    for (let i = 0; i < valuesArray.length; i++) {
        const [columnHeader, aggregationType] = valuesArray[i];
        if (valuesRecord[columnHeader] === undefined) {
            valuesRecord[columnHeader] = [];
        }
        valuesRecord[columnHeader].push(aggregationType);
    }
    return valuesRecord;
}


/* 
    A helper function for making a mapping from dfName -> index of that dataframe,
    for all the df names we can select. 

    Useful for making sure the user cannot select the pivot table they are currently
    editing as the source sheet, as this obviously causes errors.
*/
export const allDfNamesToSelectableDfNameToSheetIndex = (dfNames: string[], destinationSheetIndex?: number): Record<string, number> => {
    const selectableDfNamesToSheetIndex: Record<string, number> = {};

    for (let i = 0; i < dfNames.length; i++) {
        if (i !== destinationSheetIndex) {
            selectableDfNamesToSheetIndex[dfNames[i]] = i;
        }
    }

    return selectableDfNamesToSheetIndex;
}

/* 
    A helper function for making getting a list of 
    column headers from a list of column ids
*/
export const getColumnHeaders = (columnIDsMap: Record<string, string>, columnIDsList: string[]): string[] => {
    return columnIDsList.map(columnID => columnIDsMap[columnID]);
}

