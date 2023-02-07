import { useEffect, useRef, useState } from "react"
import { ConnectionInformation } from "../components/Mito"
import MitoAPI from "../jupyter/api"
import { CommCreationStatus, getCommContainer } from "../jupyter/comm"
import { AnalysisData, SheetData, UIState, UserProfile } from "../types"


export const useMitoAPI = (
    connectionInformation: ConnectionInformation,
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

    const [commCreationStatus, setCommCreationStatus] = useState<CommCreationStatus>('loading');

    const [streamlitOnMessage, setStreamlitOnMessage] = useState<((msg: any) => void) | undefined>(undefined)

    const numProcessed = useRef(0);
    useEffect(() => {
        if (connectionInformation.type === 'streamlit') {
            if (numProcessed.current < connectionInformation.receivedMessages.length) {
                console.log("PROCESSING MORE", streamlitOnMessage)
                for (let i = numProcessed.current; i < connectionInformation.receivedMessages.length; i++) {
                    if (streamlitOnMessage) {
                        console.log("RECEIVED MESSAGE", connectionInformation.receivedMessages[i], numProcessed.current, streamlitOnMessage)
                        streamlitOnMessage(connectionInformation.receivedMessages[i]);
                        numProcessed.current = connectionInformation.receivedMessages.length;
                    }
                }
            }
        }
    }, [connectionInformation, streamlitOnMessage])

    console.log("STREAMLIT ON MESSAGE", streamlitOnMessage)

    
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
            const commContainerOrError = await getCommContainer(connectionInformation, setStreamlitOnMessage)
            if (typeof commContainerOrError === 'string') { // Check if it it's an error
                setCommCreationStatus(commContainerOrError);
            } else {
                void mitoAPI.init(commContainerOrError);
                setCommCreationStatus('finished');
            }
        }

        void init()
    }, [])

    return {
        mitoAPI: mitoAPI,
        commCreationStatus: commCreationStatus,
    }
}