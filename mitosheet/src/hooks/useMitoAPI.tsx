import { useEffect, useState } from "react"
import MitoAPI, { getCommContainer } from "../jupyter/api"
import { AnalysisData, SheetData, UIState, UserProfile } from "../types"

export type CommCreationErrorStatus = 'non_working_extension_error' | 'no_backend_comm_registered_error' | 'non_valid_location_error';
export type CommCreationStatus = 'loading' | 'finished' | CommCreationErrorStatus;


export const useMitoAPI = (
    kernelID: string,
    commTargetID: string,
    setSheetDataArray: React.Dispatch<React.SetStateAction<SheetData[]>>,
    setAnalysisData: React.Dispatch<React.SetStateAction<AnalysisData>>,
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): {mitoAPI: MitoAPI, commCreationStatus: CommCreationStatus} => {

    const [mitoAPI] = useState<MitoAPI>(
        () => {
            return new MitoAPI(
                setSheetDataArray,
                setAnalysisData,
                setUserProfile,
                setUIState,
            )
        }
    )

    const [apiCreationStatus, setAPICreationStatus] = useState<CommCreationStatus>('loading');

    
    useEffect(() => {
        /**
         * Although we can run async code before creating the Mito react component, we
         * choose to create the comm channel here. 
         * 
         * This is because JupyterLab loads the output cell JS before loading the commands,
         * and so we cannot create a comm before creating the mitosheet unless we wait a while.
         * 
         * To avoid these ordering constraints, we just create the comm after creating Mito, 
         * and indeed try a few times to create a comm before fully giving up (see getCommContainer)
         * 
         * This leads to some grossness, where the API we might not have a ._send function that
         * is defined. But we just wait to send messages until it is, or give up after a reasonable 
         * timeout.
         */
        const init = async () => {
            const commContainer = await getCommContainer(kernelID, commTargetID)
            if (typeof commContainer === 'string') {
                setAPICreationStatus(commContainer);
            } else {
                void mitoAPI.init(commContainer);
                setAPICreationStatus('finished');
            }
        }

        void init()
    }, [])

    return {
        mitoAPI: mitoAPI,
        commCreationStatus: apiCreationStatus,
    }
}