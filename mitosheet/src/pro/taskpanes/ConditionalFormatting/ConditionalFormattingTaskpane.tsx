import React, { useState } from "react";
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import MitoAPI, { getRandomId } from "../../../jupyter/api";
import { AnalysisData, ConditionalFormat, DataframeFormat, RecursivePartial, SheetData, StepType, UIState, UserProfile } from "../../../types";
import DataframeSelect from '../../../components/elements/DataframeSelect';

import { updateObjectWithPartialObject } from "../../../utils/objects";
import TextButton from "../../../components/elements/TextButton";
import Col from "../../../components/layout/Col";
import Row from "../../../components/layout/Row";
import { checkFilterShouldHaveNumberValue } from "../../../components/taskpanes/ControlPanel/FilterAndSortTab/filter/utils";
import DefaultEmptyTaskpane from "../../../components/taskpanes/DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../../../components/taskpanes/DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../../../components/taskpanes/DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../../../components/taskpanes/DefaultTaskpane/DefaultTaskpaneHeader";
import { getDefaultDataframeFormat } from "../SetDataframeFormat/SetDataframeFormatTaskpane";
import ConditionalFormattingCard from "./ConditionalFormattingCard";


interface ConditionalFormattingTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

interface ConditionalFormattingParams {
    sheet_index: number,
    df_format: DataframeFormat,
}
const getDefaultParams = (
    sheetDataArray: SheetData[], 
    sheetIndex: number,
): ConditionalFormattingParams | undefined => {

    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {
        return undefined;
    }

    return {
        sheet_index: sheetIndex,
        df_format: sheetDataArray[sheetIndex].dfFormat || getDefaultDataframeFormat(),
    }
}

const getDefaultEmptyConditionalFormat = (): ConditionalFormat => {
    return {
        format_uuid: getRandomId(),
        columnIDs: [],
        filters: [{condition: 'not_empty', value: ''}], // Always default to one filter for now
        color: undefined,
        backgroundColor: undefined
    }
}


/* 
    This is the ConditionalFormatting taskpane.
*/
const ConditionalFormattingTaskpane = (props: ConditionalFormattingTaskpaneProps): JSX.Element => {

    const {params, setParams} = useLiveUpdatingParams(
        () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex),
        StepType.SetDataframeFormat, 
        props.mitoAPI,
        props.analysisData,
        50,
        {
            getBackendFromFrontend: (params: ConditionalFormattingParams) => {
                // We parse the filters, if they deserve to be parsed! Making sure that we make copies of 
                // everything, as to not modify objects when we don't want to. 
                // NOTE: this parsing must happen right before the parameters are sent to the backend, 
                // so that we can store the parameters as strings in the interim
                const conditionalFormats = params.df_format.conditional_formats.map(conditionalFormat => {
                    const newConditionalFormat = {...conditionalFormat};
                    const newFilters = newConditionalFormat.filters.map(filter => {
                        const newFilter = {...filter};
                        let newValue = newFilter.value;
                        if (checkFilterShouldHaveNumberValue(newFilter)) {
                            const valueAsNumber = parseFloat(newFilter.value);
                            if (!isNaN(valueAsNumber)) {
                                newValue = valueAsNumber;
                            }
                        }
                        newFilter.value = newValue;
                        return newFilter;
                    });
                    return {
                        ...newConditionalFormat,
                        filters: newFilters
                    };
                })

                return {
                    ...params,
                    df_format: {
                        ...params.df_format,
                        conditional_formats: conditionalFormats
                    }
                };
            },
            getFrontendFromBackend: (params) => {return params}
        }
    )

    const [openFormattingCardIndex, setOpenFormattingCardIndex] = useState(-1)

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const sheetData = props.sheetDataArray[params.sheet_index];
    const conditionalFormats = params.df_format.conditional_formats

    const updateDataframeFormatParams = (newParams: RecursivePartial<DataframeFormat>): void => {
        setParams(prevParams => {
            return updateObjectWithPartialObject(prevParams, {df_format: newParams})
        })
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Conditional Formatting"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody 
                userProfile={props.userProfile} 
                requiresPro
                requiresProMessage="Conditional formatting is a Mito Pro feature. Please upgrade to use this feature."
            >
                <DataframeSelect 
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={params.sheet_index}
                    onChange={(newSheetIndex) => {
                        setParams(prevParams => {
                            const newParams = getDefaultParams(props.sheetDataArray, newSheetIndex);
                            if (newParams) {
                                return newParams;
                            }
                            return {
                                ...prevParams,
                                sheet_index: newSheetIndex
                            }
                        });

                        // Then, we update the selected sheet index
                        props.setUIState(prevState => {
                            return {
                                ...prevState,
                                selectedSheetIndex: newSheetIndex
                            }
                        })
                    }}
                />
                <Row>
                    <Col>
                        <p className="text-header-3">
                            Conditional Formats
                        </p>
                        <p className='text-subtext-1 mb-10px'>
                            Rules applied in order. Later formatting rules overwrite earlier rules.
                        </p>
                    </Col>
                </Row>
                {conditionalFormats.map((conditionalFormat, index) => {
                    return (
                        <ConditionalFormattingCard
                            key={conditionalFormat.format_uuid + index}
                            df_format={params.df_format}
                            conditionalFormat={conditionalFormat}
                            updateDataframeFormatParams={updateDataframeFormatParams}
                            sheetData={sheetData}
                            openFormattingCardIndex={openFormattingCardIndex}
                            setOpenFormattingCardIndex={setOpenFormattingCardIndex}
                        />
                    )
                })}
                <Row>
                    <TextButton 
                        variant="dark"
                        onClick={() => {
                            const newConditionalFormats = [...params.df_format.conditional_formats];
                            newConditionalFormats.push(getDefaultEmptyConditionalFormat());
                            return updateDataframeFormatParams({conditional_formats: newConditionalFormats});
                        }}
                    >
                        Add Conditional Formatting Rule
                    </TextButton>
                </Row>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default ConditionalFormattingTaskpane;