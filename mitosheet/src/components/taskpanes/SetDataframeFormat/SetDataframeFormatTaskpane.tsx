import React from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, DataframeFormat, RecursivePartial, SheetData, StepType, UIState, UserProfile } from "../../../types"
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import Select from '../../elements/Select';
import DropdownItem from '../../elements/DropdownItem';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import Spacer from '../../layout/Spacer';

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import CollapsibleSection from "../../layout/CollapsibleSection";
import LabelAndColor from "../../../pro/graph/LabelAndColor";
import { updateObjectWithPartialObject } from "../../../utils/objects";
import { HEADER_BACKGROUND_COLOR_DEFAULT, HEADER_TEXT_COLOR_DEFAULT } from "../../endo/ColumnHeader";
import { EVEN_ROW_BACKGROUND_COLOR_DEFAULT, EVEN_ROW_TEXT_COLOR_DEFAULT, ODD_ROW_BACKGROUND_COLOR_DEFAULT, ODD_ROW_TEXT_COLOR_DEFAULT } from "../../endo/GridData";
import Tooltip from "../../elements/Tooltip";
import SuggestedStyles from "./SuggestedStyles";
import DataframeSelect from "../../elements/DataframeSelect";

const BORDER_COLOR_DEFAULT = '#FFFFFF'; 


interface SetDataframeFormatTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

interface SetDataframeFormatParams {
    sheet_index: number,
    df_format:  DataframeFormat
}

export const getDefaultDataframeFormat = (): DataframeFormat => {
    return {columns: {}, headers: {}, rows: {even: {}, odd: {}}, border: {}, conditional_formats: []}
}


const getDefaultParams = (
    sheetDataArray: SheetData[], 
    sheetIndex: number,
): SetDataframeFormatParams | undefined => {

    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {
        return undefined;
    }

    return {
        sheet_index: sheetIndex,
        df_format: sheetDataArray[sheetIndex].dfFormat || getDefaultDataframeFormat(),
    }
}


/* 
    This taskpane allows you to set dataframe format
*/
const SetDataframeFormatTaskpane = (props: SetDataframeFormatTaskpaneProps): JSX.Element => {

    const {params, setParams, startNewStep} = useLiveUpdatingParams(
        () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex),
        StepType.SetDataframeFormat, 
        props.mitoAPI,
        props.analysisData,
        50
    )

    const sheetFormat = (props.sheetDataArray[params?.sheet_index || 0] || {}).dfFormat;

    if (params === undefined || sheetFormat === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const updateDataframeFormatParams = (newParams: RecursivePartial<DataframeFormat>): void => {
        setParams(prevParams => {
            return updateObjectWithPartialObject(prevParams, {df_format: newParams})
        })
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Color Dataframe"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody
                userProfile={props.userProfile}
                requiresPro
                requiresProMessage="Setting the dataframe format is a Mito Pro feature. Please upgrade to use this feature."
            >
                <DataframeSelect 
                    sheetDataArray={props.sheetDataArray} 
                    sheetIndex={params.sheet_index} 
                    onChange={(newSheetIndex) => {
                        // First, we start a new step
                        startNewStep()
                        
                        // Then, update the params
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
                <SuggestedStyles updateDataframeFormatParams={updateDataframeFormatParams}/>
                <CollapsibleSection title="Column Headers">
                    <LabelAndColor
                        label='Background Color'
                        color={params.df_format.headers.backgroundColor || HEADER_BACKGROUND_COLOR_DEFAULT}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({headers: {backgroundColor: newColor}});
                        }}
                    />
                    <LabelAndColor
                        label='Text Color'
                        color={params.df_format.headers.color || HEADER_TEXT_COLOR_DEFAULT}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({headers: {color: newColor}});
                        }}
                    />
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title="Rows">
                    <LabelAndColor
                        label='Even Row: Background Color'
                        color={params.df_format.rows.even.backgroundColor || EVEN_ROW_BACKGROUND_COLOR_DEFAULT}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {even: {backgroundColor: newColor}}});
                        }}
                    />
                    <LabelAndColor
                        label='Even Row: Text Color'
                        color={params.df_format.rows.even.color || EVEN_ROW_TEXT_COLOR_DEFAULT}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {even: {color: newColor}}});
                        }}
                    />
                    <LabelAndColor
                        label='Odd Row: Background Color'
                        color={params.df_format.rows.odd.backgroundColor || ODD_ROW_BACKGROUND_COLOR_DEFAULT}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {odd: {backgroundColor: newColor}}});
                        }}
                    />
                    <LabelAndColor
                        label='Odd Row: Text Color'
                        color={params.df_format.rows.odd.color || ODD_ROW_TEXT_COLOR_DEFAULT}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {odd: {color: newColor}}});
                        }}
                    />
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title="Dataframe Border">
                    <Row justify="space-between" align="center">
                        <Col>
                            <Row justify="start" align="center">
                                <p>
                                    Border Style
                                </p>
                                <Tooltip title="The border line will be displayed when the dataframe styling object is printed out." />
                            </Row>
                            <></>
                        </Col>
                        <Col></Col>
                        <Select 
                            value={params.df_format.border.borderStyle || 'none'}  // It defaults to none
                            width='medium'
                            onChange={(newBorderStyle) => {
                                if (newBorderStyle === 'none') {
                                    return updateDataframeFormatParams({border: {borderStyle: undefined}});
                                }
                                return updateDataframeFormatParams({border: {borderStyle: newBorderStyle}});
                            }}
                        >
                            <DropdownItem title="none" />
                            <DropdownItem title="solid" />
                            <DropdownItem title="dashed" />
                            {/** TODO: do we want to give users all the options? */}
                        </Select>
                    </Row>
                    <LabelAndColor
                        label='Border Color'
                        color={params.df_format.border.borderColor || BORDER_COLOR_DEFAULT}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({border: {borderColor: newColor}});
                        }}
                    />
                </CollapsibleSection>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default SetDataframeFormatTaskpane;