import { useEffect, useState } from "react";

/* 
    This effect uses an API call to get data, while also
    keeping track if this data loaded. 

    This is useful for taskpanes that want to load state from the API
    that they want to display. For example, an ExcelImportTaskpane wants
    to load metadata about the excel file being imported -- this is a
    useful hook for this.
*/
export function useStateFromAPIAsync<ResultType, ParamType>(
    defaultValue: ResultType,
    apiCall: (...rest: ParamType[]) => Promise<ResultType | undefined>,
    onLoad: ((loadedData: ResultType) => void) | undefined,
    params: ParamType[],
): [ResultType, boolean] {
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState(defaultValue);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            // Get the data and save it
            const loadedData = await apiCall(...params);

            if (loadedData !== undefined) {
                setState(loadedData);
                if (onLoad !== undefined) {
                    // We make a copy before sending the loaded data to the callback
                    // so that we don't accidently manipulate the data
                    const loadedDataCopy = window.structuredClone(loadedData);
                    onLoad(loadedDataCopy);
                }
            }
            setLoading(false);
        }
        void loadData();
    }, params);

    return [state, loading];
}