/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, CodeSnippetAPIResult, SheetData, UIState, UserProfile } from "../../../types";

import { DISCORD_INVITE_LINK } from "../../../data/documentationLinks";
import { useDebouncedEffect } from "../../../hooks/useDebouncedEffect";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import { classNames } from "../../../utils/classNames";
import { writeTextToClipboard } from "../../../utils/copy";
import { isInDashboard } from "../../../utils/location";
import { fuzzyMatch } from "../../../utils/strings";
import Dropdown, { DROPDOWN_IGNORE_CLICK_CLASS } from "../../elements/Dropdown";
import DropdownItem from "../../elements/DropdownItem";
import Input from "../../elements/Input";
import LoadingDots from "../../elements/LoadingDots";
import CodeSnippetIcon from "../../icons/CodeSnippetIcon";
import DropdownIcon from "../../icons/DropdownIcon";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface CodeSnippetsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
    writeCodeSnippetCell?: (analysisName: string, code: string) => void
}

const CONFIRMATION_TEXT_COPIED = 'Copied code snippet to clipboard. Paste it in a code cell below.'
const CONFIRMATION_TEXT_CODE_WRITTEN = 'Code snippet written to code cell below. Scroll down to see it.'

/* 
    This is the CodeSnippets taskpane.
*/
const CodeSnippetsTaskpane = (props: CodeSnippetsTaskpaneProps): JSX.Element => {
    const [codeSnippetAPIResult] = useStateFromAPIAsync<CodeSnippetAPIResult | undefined, []>(undefined, async () => {
        const response = await props.mitoAPI.getCodeSnippets();
        return 'error' in response ? undefined : response.result

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

    if (codeSnippetAPIResult?.status === 'error') {
        return (
            <DefaultEmptyTaskpane 
                setUIState={props.setUIState}
                header={"Error loading code snippets"}
                message={codeSnippetAPIResult.error_message}
                errorMessage
                suppressImportLink={true}
            />
        )
    }

    const codeSnippetsToDisplay = codeSnippetAPIResult?.code_snippets.filter(codeSnippet => {
        return (fuzzyMatch(codeSnippet.Name, searchString) > .75)
            || fuzzyMatch(codeSnippet.Description, searchString) > .75
            || fuzzyMatch(codeSnippet.Code.join(' '), searchString) > .75
    })

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
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
                {codeSnippetsToDisplay?.map((codeSnippet, codeSnippetIndex) => {
                    const copyToClipboard = () => {
                        setConfirmationText(CONFIRMATION_TEXT_COPIED)
                        void writeTextToClipboard(codeSnippet.Code.join('\n'))
                        void props.mitoAPI.log('code_snippet_copied', {'code_snippet_name': codeSnippet.Name});
                    }
                    const writeToCell = () => {
                        setConfirmationText(CONFIRMATION_TEXT_CODE_WRITTEN)
                        if (props.writeCodeSnippetCell) {
                            props.writeCodeSnippetCell(props.analysisData.analysisName, codeSnippet.Code.join('\n'));
                        }
                        void props.mitoAPI.log('code_snippet_written_to_cell', {'code_snippet_name': codeSnippet.Name});
                    }

                    let openLocation = DISCORD_INVITE_LINK
                    const codeSnippetSupportEmail = props.userProfile.mitoConfig.MITO_CONFIG_CODE_SNIPPETS?.MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL
                    if (codeSnippetSupportEmail !== undefined && codeSnippetSupportEmail !== null) {
                        openLocation = `mailto:${codeSnippetSupportEmail}?subject=Mito Code Snippet Support. Snippet Name: "${codeSnippet.Name}" Snippet ID: "${codeSnippet.Id}"`
                    }
                    

                    const items = [
                        <DropdownItem 
                            key="Copy Code Snippet" 
                            title="Copy Code Snippet" 
                            onClick={copyToClipboard}
                        />,
                        !isInDashboard() 
                            ? <DropdownItem 
                                key="Write to Notebook" 
                                title="Write to Notebook" 
                                onClick={writeToCell}
                            />
                            : undefined
                        ,
                        <DropdownItem
                            key='Get Support'
                            title='Get Support'
                            onClick={() => {
                                window.open(openLocation)
                                void props.mitoAPI?.log('clicked_code_snippet_get_support_button')
                            }}
                        />
                    ].filter(x => x !== undefined) as JSX.Element[];
                    
                    
                    return (
                        <Row 
                            key={codeSnippetIndex} 
                            align='center' 
                            className={classNames("highlight-on-hover", DROPDOWN_IGNORE_CLICK_CLASS)} // Use DROPDOWN_IGNORE_CLICK_CLASS to avoid race condition with dropdowns opening themselves when clicked on
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
                                <Dropdown 
                                    display={codeSnippetIndex === openDropdownIndex} 
                                    width='medium'
                                    closeDropdown={() => {setOpenDropdownIndex(undefined)}}
                                >
                                    {items}
                                </Dropdown>
                            </Col>
                        </Row>
                    )
                })}
                {codeSnippetAPIResult === undefined && 
                    <p className="mt-20px">
                        Loading code snippets <LoadingDots />
                    </p>
                }
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default CodeSnippetsTaskpane;