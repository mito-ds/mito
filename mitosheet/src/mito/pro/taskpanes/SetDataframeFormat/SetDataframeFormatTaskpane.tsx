import React from "react";
import DataframeSelect from "../../../components/elements/DataframeSelect";
import DropdownItem from '../../../components/elements/DropdownItem';
import LabelAndTooltip from "../../../components/elements/LabelAndTooltip";
import Select from '../../../components/elements/Select';
import { HEADER_BACKGROUND_COLOR_DEFAULT, HEADER_TEXT_COLOR_DEFAULT } from "../../../components/endo/ColumnHeader";
import { EVEN_ROW_BACKGROUND_COLOR_DEFAULT, ROW_TEXT_COLOR_DEFAULT, ODD_ROW_BACKGROUND_COLOR_DEFAULT } from "../../../components/endo/GridData";
import Col from '../../../components/layout/Col';
import CollapsibleSection from "../../../components/layout/CollapsibleSection";
import Row from '../../../components/layout/Row';
import Spacer from '../../../components/layout/Spacer';
import DefaultEmptyTaskpane from "../../../components/taskpanes/DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../../../components/taskpanes/DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../../../components/taskpanes/DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../../../components/taskpanes/DefaultTaskpane/DefaultTaskpaneHeader";
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { MitoAPI } from "../../../api/api";
import { AnalysisData, DataframeFormat, RecursivePartial, SheetData, StepType, UIState, UserProfile } from "../../../types";
import { updateObjectWithPartialObject } from "../../../utils/objects";
import LabelAndColor from "../../graph/LabelAndColor";
import SuggestedStyles from "./SuggestedStyles";
import { convertToHex } from "../../../utils/colors";

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
    const ref = React.useRef<HTMLDivElement>(null);

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
        <DefaultTaskpane
            ref={ref}
            setUIState={props.setUIState}
            mitoAPI={props.mitoAPI}
        >
            <DefaultTaskpaneHeader 
                header="Color Dataframe"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody
                userProfile={props.userProfile}
                requiresPro={{
                    message:"Setting the dataframe format is a Mito Pro feature. Please upgrade to use this feature.",
                    mitoAPI:props.mitoAPI,
                    featureName:"Set dataframe colors"
                }}
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
                        color={convertToHex(params.df_format.headers.backgroundColor || HEADER_BACKGROUND_COLOR_DEFAULT, ref.current)}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({headers: {backgroundColor: newColor}});
                        }}
                    />
                    <LabelAndColor
                        label='Text Color'
                        color={convertToHex(params.df_format.headers.color || HEADER_TEXT_COLOR_DEFAULT, ref.current)}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({headers: {color: newColor}});
                        }}
                    />
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title="Rows">
                    <LabelAndColor
                        label='Even Row: Background Color'
                        color={convertToHex(params.df_format.rows.even.backgroundColor || EVEN_ROW_BACKGROUND_COLOR_DEFAULT, ref.current)}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {even: {backgroundColor: newColor}}});
                        }}
                    />
                    <LabelAndColor
                        label='Even Row: Text Color'
                        color={convertToHex(params.df_format.rows.even.color || ROW_TEXT_COLOR_DEFAULT, ref.current)}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {even: {color: newColor}}});
                        }}
                    />
                    <LabelAndColor
                        label='Odd Row: Background Color'
                        color={convertToHex(params.df_format.rows.odd.backgroundColor || ODD_ROW_BACKGROUND_COLOR_DEFAULT, ref.current)}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {odd: {backgroundColor: newColor}}});
                        }}
                    />
                    <LabelAndColor
                        label='Odd Row: Text Color'
                        color={convertToHex(params.df_format.rows.odd.color || ROW_TEXT_COLOR_DEFAULT, ref.current)}
                        onChange={(newColor) => {
                            return updateDataframeFormatParams({rows: {odd: {color: newColor}}});
                        }}
                    />
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title="Dataframe Border">
                    <Row justify="space-between" align="center">
                        <Col>
                            <LabelAndTooltip tooltip="The border line will be displayed when the dataframe styling object is printed out." textBody>
                                Border Style
                            </LabelAndTooltip>
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
                        color={convertToHex(params.df_format.border.borderColor || BORDER_COLOR_DEFAULT, ref.current)}
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