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
                    onLoad(loadedData);
                }
            }
        }
        void loadData();
    }, []);

    return [state, setState];
}