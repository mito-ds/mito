import React, { useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, CodeSnippet, SheetData, UIState, UserProfile } from "../../../types"

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import Input from "../../elements/Input";
import { fuzzyMatch } from "../../../utils/strings";
import Row from "../../layout/Row";
import Col from "../../layout/Col";
import DropdownIcon from "../../icons/DropdownIcon";
import Dropdown from "../../elements/Dropdown";
import DropdownItem from "../../elements/DropdownItem";
import { writeTextToClipboard } from "../../../utils/copy";
import CodeSnippetIcon from "../../icons/CodeSnippetIcon";
import { writeCodeSnippetCell } from "../../../jupyter/jupyterUtils";


interface CodeSnippetsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}



/* 
    This is the CodeSnippets taskpane.
*/
const CodeSnippetsTaskpane = (props: CodeSnippetsTaskpaneProps): JSX.Element => {
    const [allCodeSnippets] = useStateFromAPIAsync<CodeSnippet[], []>([], () => {
        return props.mitoAPI.getCodeSnippets();
    }, undefined, [])

    const [searchString, setSearchString] = useState('');
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | undefined>(undefined);

    const codeSnippetsToDisplay = allCodeSnippets.filter(codeSnippet => {
        return (fuzzyMatch(codeSnippet.Name, searchString) > .75)
            || fuzzyMatch(codeSnippet.Description, searchString) > .75
            || fuzzyMatch(codeSnippet.Code.join(' '), searchString) > .75
    })


    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Code Snippets"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <Input
                    value={searchString}
                    onChange={(e) => {
                        setSearchString(e.target.value)
                    }}
                    placeholder='Search for a code snippet by name or content'
                />
                {codeSnippetsToDisplay.map((codeSnippet, codeSnippetIndex) => {
                    const copyToClipboard = () => {
                        writeTextToClipboard(codeSnippet.Code.join('\n'))
                        void props.mitoAPI.log('code_snippet_copied', {'Name': codeSnippet.Name});
                    }
                    const writeToCell = () => {
                        writeCodeSnippetCell(props.analysisData.analysisName, codeSnippet.Code.join('\n'));
                        void props.mitoAPI.log('code_snippet_written_to_cell', {'Name': codeSnippet.Name});
                    }

                    return (
                        <Row key={codeSnippetIndex} align='center' justify="space-between">
                            <Col offsetRight={.5}>
                                <CodeSnippetIcon/>
                            </Col>
                            <Col span={20}>
                                <div className="text-bold">{codeSnippet.Name}</div>
                                <div className="text-overflow-scroll pb-5px">{codeSnippet.Description}</div>
                            </Col>
                            <Col 
                                onClick={() => {
                                    setOpenDropdownIndex(prevOpenDropdownIndex => {
                                        if (prevOpenDropdownIndex === codeSnippetIndex) {
                                            return undefined;
                                        }
                                        return codeSnippetIndex;
                                    })
                                }} 
                                offset={2}
                            >
                                <DropdownIcon/>
                            </Col>
                            <Col>
                                {<Dropdown 
                                    display={codeSnippetIndex === openDropdownIndex} 
                                    closeDropdown={() => setOpenDropdownIndex(undefined)}
                                    width='medium'
                                >
                                    <DropdownItem 
                                        title="Copy Code Snippet" 
                                        onClick={copyToClipboard}
                                    />
                                    <DropdownItem 
                                        title="Write to Notebook" 
                                        onClick={writeToCell}
                                    />
                                </Dropdown>}
                            </Col>
                        </Row>
                    )
                })}
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default CodeSnippetsTaskpane;