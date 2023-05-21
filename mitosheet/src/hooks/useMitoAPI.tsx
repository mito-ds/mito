import { useState } from "react"
import MitoAPI from "../api/api"
import { CommCreationErrorStatus, CommCreationStatus } from "../jupyter/comm"
import { AnalysisData, SheetData, UIState, UserProfile } from "../types"
import { SendFunction } from "../api/send"


export const useMitoAPI = (
    getSendFunction: () => Promise<SendFunction | CommCreationErrorStatus>,
    setSheetDataArray: React.Dispatch<React.SetStateAction<SheetData[]>>,
    setAnalysisData: React.Dispatch<React.SetStateAction<AnalysisData>>,
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): {mitoAPI: MitoAPI, commCreationStatus: CommCreationStatus} => {

    const [commCreationStatus, setCommCreationStatus] = useState<CommCreationStatus>('loading');

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
        commCreationStatus: commCreationStatus,
    }
}