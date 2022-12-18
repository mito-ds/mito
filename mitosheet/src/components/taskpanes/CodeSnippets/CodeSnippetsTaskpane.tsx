import React, { useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, CodeSnippet, MitoEnterpriseConfigKey, SheetData, UIState, UserProfile } from "../../../types"

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
import { useDebouncedEffect } from "../../../hooks/useDebouncedEffect";
import { DEFAULT_SUPPORT_EMAIL } from "../../elements/GetSupportButton";
import { SLACK_INVITE_LINK } from "../../../data/documentationLinks";


interface CodeSnippetsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

const CONFIRMATION_TEXT_COPIED = 'Copied code snippet to clipboard. Paste it in a code cell below.'
const CONFIRMATION_TEXT_CODE_WRITTEN = 'Code snippet written to code cell below. Scroll down to see it.'

/* 
    This is the CodeSnippets taskpane.
*/
const CodeSnippetsTaskpane = (props: CodeSnippetsTaskpaneProps): JSX.Element => {
    const [allCodeSnippets] = useStateFromAPIAsync<CodeSnippet[], []>([], () => {
        return props.mitoAPI.getCodeSnippets();
    }, undefined, [])

    const [searchString, setSearchString] = useState('');
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | undefined>(undefined);
    const [confirmationText, setConfirmationText] = useState<string | undefined>(undefined)

    // Remove the confirmation text after 3 seconds
    useDebouncedEffect(() => {
        if (confirmationText !== undefined) {
            setConfirmationText(undefined)
        }
    }, [confirmationText], 3000)

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
                
                {confirmationText !== undefined && 
                    <p className="text-color-success">
                        {confirmationText}
                    </p>
                }
                {codeSnippetsToDisplay.map((codeSnippet, codeSnippetIndex) => {
                    const copyToClipboard = () => {
                        setConfirmationText(CONFIRMATION_TEXT_COPIED)
                        void writeTextToClipboard(codeSnippet.Code.join('\n'))
                        void props.mitoAPI.log('code_snippet_copied', {'code_snippet_name': codeSnippet.Name});
                    }
                    const writeToCell = () => {
                        setConfirmationText(CONFIRMATION_TEXT_CODE_WRITTEN)
                        writeCodeSnippetCell(props.analysisData.analysisName, codeSnippet.Code.join('\n'));
                        void props.mitoAPI.log('code_snippet_written_to_cell', {'code_snippet_name': codeSnippet.Name});
                    }

                    return (
                        <Row 
                            key={codeSnippetIndex} 
                            align='center' 
                            className="highlight-on-hover"
                            justify="space-between"
                            onClick={() => {
                                setOpenDropdownIndex(prevOpenDropdownIndex => {
                                    if (prevOpenDropdownIndex === codeSnippetIndex) {
                                        return undefined;
                                    }
                                    return codeSnippetIndex;
                                })
                            }} 
                        >
                            <Col offsetRight={.5}>
                                <CodeSnippetIcon/>
                            </Col>
                            <Col span={20}>
                                <div className="text-bold">{codeSnippet.Name}</div>
                                <div className="text-overflow-wrap pb-5px">{codeSnippet.Description}</div>
                            </Col>
                            <Col 
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
                                    <DropdownItem
                                        title='Get Support'
                                        onClick={() => {
                                            const openLocation = props.userProfile.mitoConfig[MitoEnterpriseConfigKey.CODE_SNIPPETS_SUPPORT_EMAIL] === DEFAULT_SUPPORT_EMAIL ? SLACK_INVITE_LINK : `mailto:${props.userProfile.mitoConfig[MitoEnterpriseConfigKey.CODE_SNIPPETS_SUPPORT_EMAIL]}?subject=Mito Code Snippet Support: ID ${codeSnippet.Id}`
                                            window.open(openLocation)
                                            void props.mitoAPI?.log('clicked_code_snippet_get_support_button')
                                        }}
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