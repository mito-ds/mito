import { useState } from "react"
import { MitoAPI } from "../api/api"
import { AnalysisData, SheetData, UIState, UserProfile } from "../types"
import { SendFunction, SendFunctionError, SendFunctionStatus } from "../api/send"


export const useMitoAPI = (
    getSendFunction: () => Promise<SendFunction | SendFunctionError>,
    setSheetDataArray: React.Dispatch<React.SetStateAction<SheetData[]>>,
    setAnalysisData: React.Dispatch<React.SetStateAction<AnalysisData>>,
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): {mitoAPI: MitoAPI, sendFunctionStatus: SendFunctionStatus} => {

    const [sendFunctionStatus, setCommCreationStatus] = useState<SendFunctionStatus>('loading');

    const [mitoAPI] = useState<MitoAPI>(
        () => {
            return new MitoAPI(
                async () => {
                    const fetchFunction = await getSendFunction();
                    if (typeof fetchFunction === 'string') { // Check if it's an error
                        setCommCreationStatus(fetchFunction);
                        return undefined;
                    } else {
                        setCommCreationStatus('finished');
                        return fetchFunction
                    }
                },
                setSheetDataArray,
                setAnalysisData,
                setUserProfile,
                setUIState,
            )
        }
    )

    return {
        mitoAPI: mitoAPI,
        sendFunctionStatus: sendFunctionStatus,
    }
}