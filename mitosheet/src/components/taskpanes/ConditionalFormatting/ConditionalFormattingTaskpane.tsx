import React from "react";
import MitoAPI, { getRandomId } from "../../../jupyter/api";
import { AnalysisData, ConditionalFormat, DataframeFormat, RecursivePartial, SheetData, StepType, UIState, UserProfile } from "../../../types"
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import DataframeSelect from '../../elements/DataframeSelect';

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import ConditionalFormattingCard from "./ConditionalFormattingCard";
import { updateObjectWithPartialObject } from "../../../utils/objects";
import TextButton from "../../elements/TextButton";
import { getDefaultDataframeFormat } from "../SetDataframeFormat/SetDataframeFormatTaskpane";


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
        invalidFilterColumnIDs: [],
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
        50
    )

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
                header="ConditionalFormatting"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody 
                userProfile={props.userProfile} 
                requiresPro={true}
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
                    }}
                />
                <p className="text-header-3">Conditional Formats</p>
                {conditionalFormats.map((conditionalFormat, index) => {
                    return (
                        <ConditionalFormattingCard
                            key={conditionalFormat.format_uuid}
                            df_format={params.df_format}
                            index={index}    
                            conditionalFormat={conditionalFormat}
                            updateDataframeFormatParams={updateDataframeFormatParams}
                            sheetData={sheetData}
                        />
                    )
                })}
                <TextButton 
                    variant="dark"
                    onClick={() => {
                        const newConditionalFormats = [...params.df_format.conditional_formats];
                        newConditionalFormats.push(getDefaultEmptyConditionalFormat());
                        console.log(newConditionalFormats);
                        return updateDataframeFormatParams({conditional_formats: newConditionalFormats});
                    }}
                >
                    Add Conditional Formatting Rule
                </TextButton>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default ConditionalFormattingTaskpane;