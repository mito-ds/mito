import React from "react";
import { AnalysisData, SheetData, UserDefinedFunction } from "../../../types";
import { getInitialEmptyParameters } from '../../../utils/userDefinedFunctionUtils';
import DropdownItem from "../../elements/DropdownItem";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import Select from "../../elements/Select";
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import UserDefinedFunctionParamConfigSection from "./UserDefinedFunctionParamConfigSection";
import { getNoImportMessage, UserDefinedImportParams } from "./UserDefinedImportTaskpane";


export const getEmptyDefaultParamsForImporter = (
    sheetDataArray: SheetData[],
    userDefinedImporter: UserDefinedFunction
): UserDefinedImportParams => {
    return {
        importer: userDefinedImporter.name,
        importer_params: getInitialEmptyParameters(sheetDataArray, userDefinedImporter.parameters)
    }
}


const UserDefinedImportImportConfig = (props: {
    sheetDataArray: SheetData[],
    params: UserDefinedImportParams | undefined
    setParams: React.Dispatch<React.SetStateAction<UserDefinedImportParams | undefined>>
    error: string | undefined
    analysisData: AnalysisData
}): JSX.Element => {

    const params = props.params

    const userDefinedImporter = params !== undefined ? props.analysisData.userDefinedImporters.find(importer => importer.name === params.importer) : undefined;

    return (
        <>
            {params === undefined &&
                <p>
                    {getNoImportMessage()}
                </p>
            }
            {params !== undefined &&
                <>
                    <Row justify='space-between' align='center' title='Select the function with which to import data.'>
                        <Col>
                            <p className='text-header-3'>
                                Import Method
                            </p>
                        </Col>
                        <Col>
                            <Select
                                width='medium'
                                value={params.importer}
                                onChange={(newValue) => {                                    
                                    props.setParams(prevParams => {
                                        const userDefinedImporter = props.analysisData.userDefinedImporters.find(importer => importer.name === newValue);
                                        if (userDefinedImporter === undefined) {
                                            return prevParams
                                        }
                                        return getEmptyDefaultParamsForImporter(props.sheetDataArray, userDefinedImporter);
                                    })
                                }}
                            >
                                {props.analysisData.userDefinedImporters.map(importer => {
                                    return (
                                        <DropdownItem 
                                            key={importer.name}
                                            title={importer.name}
                                            subtext={importer.docstring}
                                        />
                                    )
                                })}
                            </Select>
                        </Col>
                    </Row>
                    {userDefinedImporter?.parameters !== undefined && Object.keys(userDefinedImporter?.parameters).length > 0 && 
                        <LabelAndTooltip tooltip="Set parameters to the import method to configure how data is imported.">Import Parameters</LabelAndTooltip>
                    }
                    <UserDefinedFunctionParamConfigSection
                        paramNameToType={userDefinedImporter?.parameters}
                        params={params.importer_params}
                        setParams={(newImportParams) => {
                            props.setParams(prevParams => {
                                if (prevParams == undefined) {
                                    return prevParams;
                                }
                                return {
                                    ...prevParams,
                                    importer_params: newImportParams
                                }
                            })
                        }}
                        sheetDataArray={props.sheetDataArray}
                    />

                    {props.error !== undefined && 
                        <p className="text-color-error">{props.error}</p>
                    }
                </>
            }
        </>
    )
    
}

export default UserDefinedImportImportConfig;

