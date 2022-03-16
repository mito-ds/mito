import { DataframeID, SheetData } from "../../../types";
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
export const getSelectableDFNamesToDataframeID = (sheetDataMap: Record<DataframeID, SheetData>, destinationDataframeID?: DataframeID): Record<string, DataframeID> => {
    const selectableDFNamesToDataframeID: Record<string, DataframeID> = {};

    Object.entries(sheetDataMap).forEach(([dataframeID, sheetData]) => {
        if (dataframeID === destinationDataframeID) {
            return;
        } 
        selectableDFNamesToDataframeID[sheetData.dfName] = dataframeID;
    })

    return selectableDFNamesToDataframeID;
}