import React, { useEffect } from "react";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import MitoAPI from "../../../jupyter/api";
import { writeCodeSnippetToCell } from "../../../jupyter/jupyterUtils";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface codeSnippetsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

/* 
    This is the codeSnippets taskpane.
*/
const CodeSnippetsTaskpane = (props: codeSnippetsTaskpaneProps): JSX.Element => {

    
    const [codeSnippets] = useStateFromAPIAsync(
        'start',
        () => {return props.mitoAPI.getCodeSnippets()},
        undefined,
        []
    )

    useEffect(() => {
        console.log(codeSnippets)
        writeCodeSnippetToCell(props.analysisData.analysisName, codeSnippets)
    }, [codeSnippets])

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="codeSnippets"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <div key={codeSnippets}>
                    <code>{codeSnippets}</code>
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default CodeSnippetsTaskpane;