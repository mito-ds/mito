import React, { useEffect, useState } from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";
import { toggleInArray } from "../../../utils/arrays";

import { classNames } from "../../../utils/classNames";
import { updateObjectWithPartialObject } from "../../../utils/objects";
import DropdownItem from "../../elements/DropdownItem";
import Input from "../../elements/Input";
import MultiToggleBox from "../../elements/MultiToggleBox";
import MultiToggleItem from "../../elements/MultiToggleItem";
import Select from "../../elements/Select";
import TextButton from "../../elements/TextButton";
import Col from "../../layout/Col";
import CollapsibleSection from "../../layout/CollapsibleSection";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface SnowflakeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

export type SnowflakeCredentialsValidityCheckResult = {type: 'success'} | {type: 'error', 'error_message': string}

export type SnowflakeCredentials = {type: 'username/password', username: string, password: string, account: string};

export type SnowflakeConnection = {
    warehouse: string | undefined, 
    database: string | undefined, 
    schema: string | undefined,
    table: string | undefined
}

export type SnowflakeQueryParams = {
	columns: string[],
	limit: number | undefined
}

export type SnowflakeConfigOptions = {
	warehouses: string[],
	databases: string[],
	schemas: string[],
	tables: string[]
	columns: string[]
}

export interface SnowflakeImportParams {
    credentials: SnowflakeCredentials,
    connection: SnowflakeConnection,
    query_params: SnowflakeQueryParams,
}

const getDefaultParams = (): SnowflakeImportParams | undefined => {
    return {
        credentials: {type: 'username/password', username: '', password: '', account: ''},
        connection: {warehouse: undefined, database: undefined, schema: undefined, table: undefined},
        query_params: {columns: [], limit: undefined},
    }
}

export type ConnectionResult = {
    type: 'success',
    config_options: SnowflakeConfigOptions,
    connection: SnowflakeConnection
    query_params: SnowflakeQueryParams
} | {
    type: 'error',
    error_message: string
}


/* 
    This is the SnowflakeImport taskpane.
*/
const SnowflakeImportTaskpane = (props: SnowflakeImportTaskpaneProps): JSX.Element => {

    //loading, edit, editApplied
    const {params, setParams} = useSendEditOnClick<SnowflakeImportParams, undefined>(
            () => getDefaultParams(),
            StepType.SnowflakeImport, 
            props.mitoAPI,
            props.analysisData,
    )
    
    const [openCredentialsSection, setOpenCredentialsSection] = useState(true);
    const [connectionResult, setConnectionResult] = useState<ConnectionResult | undefined>(undefined);
    const [liveUpdateNumber, setLiveUpdateNumber] = useState(0) 

    const getAvailableOptionsAndDefaults = (newParams: SnowflakeImportParams): void => {
        setParams(newParams)
        setLiveUpdateNumber(old => old + 1)
    }

    useEffect(() => {
        if (liveUpdateNumber === 0) {
            // Don't run on first render
            return
        }
        _getAvailableOptionsAndDefaults()
    }, [liveUpdateNumber])

    const _getAvailableOptionsAndDefaults = async () => {
        if (params === undefined) {
            // We don't expect this to ever happen because of the UI restrictions
            return 
        }

        const snowflakeConnection = await props.mitoAPI.getSnowflakeConnection(params);

        //console.log(snowflakeConnection)
        setConnectionResult(snowflakeConnection);

        if (snowflakeConnection?.type === 'success') {
            setParams((prevParams) => {
                return {
                    ...prevParams,
                    connection: snowflakeConnection.connection,
                    query_params: snowflakeConnection.query_params
                }
            })

            // If the user connects successful, we close the connection window
            setOpenCredentialsSection(false);
        }
    }

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }


    // TODO: Wrap this in a function to handle a loading indicator and actually waiting for results properly
    const validateSnowflakeCredentials = async () => {
        if (params === undefined) {
            // We don't expect this to ever happen because of the UI restrictions
            return 
        }

        const validateSnowflakeCredentialsResult = await props.mitoAPI.validateSnowflakeCredentials(params.credentials)
        console.log(validateSnowflakeCredentialsResult)

        if (validateSnowflakeCredentialsResult?.type === 'success') {
            setOpenCredentialsSection(false)
        } else {
            // Display error message too
            setOpenCredentialsSection(true)
        }
    }

    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Import from Snowflake"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <CollapsibleSection title='Connection' open={openCredentialsSection}>
                    <Row justify="space-between">
                        <Col>
                            Username
                        </Col>
                        <Col>
                            <Input 
                                value={params.credentials.username} 
                                onChange={(e) => {
                                    const newUsername = e.target.value;
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'credentials': {'username': newUsername}});
                                    })
                                }}/>
                        </Col>
                    </Row>
                    <Row justify="space-between">
                        <Col>
                            Password
                        </Col>
                        <Col>
                            <Input 
                                value={params.credentials.password} 
                                type='password'
                                onChange={(e) => {
                                    const newUsername = e.target.value;
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'credentials': {'password': newUsername}});
                                    })
                                }}/>
                        </Col>
                    </Row>
                    <Row justify="space-between">
                        <Col>
                            Account
                        </Col>
                        <Col>
                            <Input 
                                value={params.credentials.account} 
                                onChange={(e) => {
                                    const newUsername = e.target.value;
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'credentials': {'account': newUsername}});
                                    })
                                }}/>
                        </Col>
                    </Row>
                    {/* TODO: Make pressing enter if they have not yet connected submit this button? */}
                    <TextButton
                        disabled={params.credentials.username.length === 0 || params.credentials.password.length === 0 || params.credentials.account.length === 0}
                        disabledTooltip='Please fill out the username, password, and account fields below.'
                        onClick={() => {
                            validateSnowflakeCredentials()
                            getAvailableOptionsAndDefaults(params)
                        }}
                        variant='dark'
                    >
                        Connect to Snowflake
                    </TextButton>
                    {connectionResult !== undefined &&
                        <div className={(classNames({'text-color-error': connectionResult.type === 'error', 'text-color-success': connectionResult.type === 'success'}))}>
                            {connectionResult.type === 'success' && "Successfully connected to Snowflake instance."}
                            {connectionResult.type === 'error' && connectionResult.error_message}
                        </div>
                    }
                </CollapsibleSection>
                <Spacer px={20}/>
                <CollapsibleSection title="Connection Location" open={connectionResult?.type === 'success'}>
                    <Row justify="space-between">
                        <Col>
                            Warehouse
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.connection.warehouse || 'None available'}
                                onChange={(newWarehouse) => {
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'connection': {'warehouse': newWarehouse}});
                                    })
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.config_options.warehouses.map((warehouse) => {
                                    return (
                                        <DropdownItem id={warehouse} title={warehouse}/>
                                    )
                                }) : []}
                            </Select>
                        </Col>
                    </Row>
                    <Row justify="space-between">
                        <Col>
                            Database
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.connection.database || 'None available'}
                                onChange={(newDatabase) => {
                                    if (newDatabase === params['connection']['database']) {
                                        return 
                                    }
                                    
                                    const paramsCopy: SnowflakeImportParams = {...params}
                                    const newParams = {
                                        ...paramsCopy, 
                                        'connection': {
                                            ...paramsCopy.connection,
                                            'database': newDatabase,
                                            'schema': undefined
                                        },
                                        'query_params': {
                                            'table': undefined,
                                            'columns': [],
                                            'limit': undefined
                                        }
                                    }
                                    
                                    getAvailableOptionsAndDefaults(newParams)
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.config_options.databases.map((database) => {
                                    return (
                                        <DropdownItem id={database} title={database}/>
                                    )
                                }) : []}
                            </Select>
                        </Col>
                    </Row>
                    <Row justify="space-between">
                        <Col>
                            Schema
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.connection.schema || 'None available'}
                                onChange={(newSchema) => {
                                    if (newSchema === params['connection']['schema']) {
                                        return 
                                    }
                                    
                                    const paramsCopy: SnowflakeImportParams = {...params}
                                    const newParams = {
                                        ...paramsCopy, 
                                        'connection': {
                                            ...paramsCopy.connection,
                                            'schema': newSchema
                                        },
                                        'query_params': {
                                            'table': undefined,
                                            'columns': [],
                                            'limit': undefined // TODO: Maybe don't reset the limit??
                                        }
                                    }
                                    
                                    getAvailableOptionsAndDefaults(newParams)
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.config_options.schemas.map((schema) => {
                                    return (
                                        <DropdownItem id={schema} title={schema}/>
                                    )
                                }) : []}
                            </Select>
                        </Col>
                    </Row>
                    <Row justify="space-between">
                        <Col>
                            Table
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.connection.table || 'None available'}
                                onChange={(newTable) => {
                                    if (newTable === params['connection']['table']) {
                                        return 
                                    }
                                    
                                    const paramsCopy: SnowflakeImportParams = {...params}
                                    const newParams = {
                                        ...paramsCopy, 
                                        'query_params': {
                                            'table': newTable,
                                            'columns': [],
                                            'limit': undefined // TODO: Maybe don't reset the limit??
                                        }
                                    }
                                    
                                    getAvailableOptionsAndDefaults(newParams)
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.config_options.tables.map((table) => {
                                    return (
                                        <DropdownItem id={table} title={table}/>
                                    )
                                }) : []}
                            </Select>
                        </Col>
                    </Row>
                </CollapsibleSection>
                <Row justify="start">
                    <p className="text-header-3">Columns to Import</p>
                </Row>
                {connectionResult?.type === 'success' &&
                    <MultiToggleBox
                        toggleAllIndexes={(indexesToToggle) => {
                            setParams(prevParams => {
                                const newColumns = [...prevParams.query_params.columns];
                                const columnsToToggle = indexesToToggle.map(index => connectionResult.config_options.columns[index]);
                                columnsToToggle.forEach(sheetName => {
                                    toggleInArray(newColumns, sheetName);
                                })

                                return updateObjectWithPartialObject(prevParams, {'query_params': {'columns': newColumns}});
                            })
                        }}
                    >
                        {connectionResult.config_options.columns.map((column, index) => {
                            const isToggled = params.query_params.columns.includes(column);
                            return (
                                <MultiToggleItem 
                                    title={column} 
                                    toggled={isToggled} 
                                    onToggle={() => {
                                        setParams((prevParams) => {
                                            const newColumns = [...prevParams.query_params.columns];
                                            toggleInArray(newColumns, column);

                                            return updateObjectWithPartialObject(prevParams, {'query_params': {'columns': newColumns}})
                                        })
                                    }} 
                                    index={index}
                                />
                            )
                        })}

                    </MultiToggleBox>
                }
                
                {/* TODO: add the user input for query_params of type Any */}

            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default SnowflakeImportTaskpane;