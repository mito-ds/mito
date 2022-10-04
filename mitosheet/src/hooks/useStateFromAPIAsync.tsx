import { useEffect, useState } from "react";

/* 
    This effect uses an API call to get data
*/
export function useStateFromAPIAsync<T>(
        defaultValue: T,
        apiCall: () => Promise<T | undefined>,
        onLoad?: (loadedData: T) => void
    ): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState(defaultValue);

    useEffect(() => {
        const loadData = async () => {
            // Get the data and save it
            const loadedData = await apiCall();
            if (loadedData !== undefined) {
                setState(loadedData);
                if (onLoad !== undefined) {
                    // We make a copy before sending the loaded data to the callback
                    // so that we don't accidently manipulate the data
                    const loadedDataCopy = JSON.parse(JSON.stringify(loadedData));
                    onLoad(loadedDataCopy);
                }
            }
        }
        void loadData();
    }, []);

    return [state, setState];
}