import React, { useState } from "react";
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

export type SnowflakeTableLocationAndWarehouse = {
    warehouse: string | undefined | null, 
    database: string | undefined | null, 
    schema: string | undefined | null,
    table: string | undefined | null
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
    table_loc_and_warehouse: SnowflakeTableLocationAndWarehouse,
    query_params: SnowflakeQueryParams,
}

const getDefaultParams = (): SnowflakeImportParams | undefined => {
    return {
        credentials: {type: 'username/password', username: '', password: '', account: ''},
        table_loc_and_warehouse: {warehouse: undefined, database: undefined, schema: undefined, table: undefined},
        query_params: {columns: [], limit: undefined},
    }
}

export type AvailableSnowflakeOptionsAndDefaults = {
    type: 'success',
    config_options: SnowflakeConfigOptions,
    default_values: SnowflakeTableLocationAndWarehouse
} | {
    type: 'error',
    error_message: string
}


const getNewParams = (prevParams: SnowflakeImportParams, database?: string | null, schema?: string | null, table?: string | null) => {
    const paramsCopy: SnowflakeImportParams = JSON.parse(JSON.stringify(prevParams))
    const newParams = {
        ...paramsCopy, 
        'table_loc_and_warehouse': {
            ...paramsCopy.table_loc_and_warehouse,
            'database': database,
            'schema': schema,
            'table': table,
        },
        'query_params': {
            'columns': [],
            'limit': undefined
        }
    }

    // If we didn't change anything, we just return the original params. This way, we can not 
    // trigger a react refresh -- which is nice
    if (JSON.stringify(newParams) === JSON.stringify(prevParams)) {
        return prevParams;
    }

    return newParams
}

/* 
    This is the SnowflakeImport taskpane.
*/
const SnowflakeImportTaskpane = (props: SnowflakeImportTaskpaneProps): JSX.Element => {

    const {params, setParams: setParamsWithoutRefreshOptionsAndDefaults, edit} = useSendEditOnClick<SnowflakeImportParams, undefined>(
            () => getDefaultParams(),
            StepType.SnowflakeImport, 
            props.mitoAPI,
            props.analysisData,
    )
    
    const [credentialsSectionIsOpen, setCredentialsSectionIsOpen] = useState(true);
    const [availableSnowflakeOptionsAndDefaults, setAvailableSnowflakeOptionsAndDefaults] = useState<AvailableSnowflakeOptionsAndDefaults | undefined>(undefined);

    // Because we don't always want to refresh defaults, we have an setParamsWithoutDefaultRefresh functions that will
    // set params without doing so. This will both set the params and refresh the defaults, doh
    const setParamsAndRefreshOptionsAndDefaults = (newParams: SnowflakeImportParams): void => {
        setParamsWithoutRefreshOptionsAndDefaults(newParams);
        void loadAndSetOptionsAndDefaults(newParams);
    }

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const loadAndSetOptionsAndDefaults = async (newParams: SnowflakeImportParams) => {
        const availableSnowflakeOptionsAndDefaults = await props.mitoAPI.getAvailableSnowflakeOptionsAndDefaults(newParams.credentials, newParams.table_loc_and_warehouse);
        setAvailableSnowflakeOptionsAndDefaults(availableSnowflakeOptionsAndDefaults);

        if (availableSnowflakeOptionsAndDefaults?.type === 'success') {
            setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                return {
                    ...prevParams,
                    table_loc_and_warehouse: availableSnowflakeOptionsAndDefaults.default_values
                }
            })
        }
    }

    // TODO: Wrap this in a function to handle a loading indicator and actually waiting for results properly
    const validateSnowflakeCredentials = async () => {
        const validityCheckResult = await props.mitoAPI.validateSnowflakeCredentials(params.credentials);
        if (validityCheckResult?.type === 'success') {
            // If the user connects successful, we close the connection window
            setCredentialsSectionIsOpen(false);
        }
    }
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Import from Snowflake"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <CollapsibleSection title='Connection' open={credentialsSectionIsOpen}>
                    <Row justify="space-between">
                        <Col>
                            Username
                        </Col>
                        <Col>
                            <Input 
                                value={params.credentials.username} 
                                onChange={(e) => {
                                    const newUsername = e.target.value;
                                    setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {credentials: {username: newUsername}});
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
                                    const newPassword = e.target.value;
                                    setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {credentials: {password: newPassword}});
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
                                    const newAccount = e.target.value;
                                    setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {credentials: {account: newAccount}});
                                    })
                                }}/>
                        </Col>
                    </Row>
                    {/* TODO: Make pressing enter if they have not yet connected submit this button? */}
                    <TextButton
                        disabled={params.credentials.username.length === 0 || params.credentials.password.length === 0 || params.credentials.account.length === 0}
                        disabledTooltip='Please fill out the username, password, and account fields below.'
                        onClick={async () => {
                            await validateSnowflakeCredentials();
                            await loadAndSetOptionsAndDefaults(params);
                        }}
                        variant='dark'
                    >
                        Connect to Snowflake
                    </TextButton>
                    {availableSnowflakeOptionsAndDefaults !== undefined &&
                        <div className={(classNames({'text-color-error': availableSnowflakeOptionsAndDefaults.type === 'error', 'text-color-success': availableSnowflakeOptionsAndDefaults.type === 'success'}))}>
                            {availableSnowflakeOptionsAndDefaults.type === 'success' && "Successfully connected to Snowflake instance."}
                            {availableSnowflakeOptionsAndDefaults.type === 'error' && availableSnowflakeOptionsAndDefaults.error_message}
                        </div>
                    }
                </CollapsibleSection>
                <Spacer px={20}/>
                <CollapsibleSection title="Connection Location" open={availableSnowflakeOptionsAndDefaults?.type === 'success'}>
                    <Row justify="space-between">
                        <Col>
                            Warehouse
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.table_loc_and_warehouse.warehouse || 'None available'}
                                onChange={(newWarehouse) => {
                                    setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {table_loc_and_warehouse: {warehouse: newWarehouse}});
                                    })
                                }}
                            >
                                {availableSnowflakeOptionsAndDefaults?.type === 'success' ? availableSnowflakeOptionsAndDefaults.config_options.warehouses.map((warehouse) => {
                                    return (
                                        <DropdownItem key={warehouse} id={warehouse} title={warehouse}/>
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
                                value={params.table_loc_and_warehouse.database || 'None available'}
                                onChange={(newDatabase) => {
                                    const newParams = getNewParams(params, newDatabase)
                                    setParamsAndRefreshOptionsAndDefaults(newParams)
                                }}
                            >
                                {availableSnowflakeOptionsAndDefaults?.type === 'success' ? availableSnowflakeOptionsAndDefaults.config_options.databases.map((database) => {
                                    return (
                                        <DropdownItem key={database} id={database} title={database}/>
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
                                value={params.table_loc_and_warehouse.schema || 'None available'}
                                onChange={(newSchema) => {
                                    const newParams = getNewParams(params, params.table_loc_and_warehouse.database, newSchema);
                                    setParamsAndRefreshOptionsAndDefaults(newParams)
                                }}
                            >
                                {availableSnowflakeOptionsAndDefaults?.type === 'success' ? availableSnowflakeOptionsAndDefaults.config_options.schemas.map((schema) => {
                                    return (
                                        <DropdownItem key={schema} id={schema} title={schema}/>
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
                                value={params.table_loc_and_warehouse.table || 'None available'}
                                onChange={(newTable) => {
                                    const newParams = getNewParams(params, params.table_loc_and_warehouse.database, params.table_loc_and_warehouse.schema, newTable)
                                    setParamsAndRefreshOptionsAndDefaults(newParams)
                                }}
                            >
                                {availableSnowflakeOptionsAndDefaults?.type === 'success' ? availableSnowflakeOptionsAndDefaults.config_options.tables.map((table) => {
                                    return (
                                        <DropdownItem key={table} id={table} title={table}/>
                                    )
                                }) : []}
                            </Select>
                        </Col>
                    </Row>
                </CollapsibleSection>
                <Row justify="start">
                    <p className="text-header-3">Columns to Import</p>
                </Row>
                {availableSnowflakeOptionsAndDefaults?.type === 'success' &&
                    <>
                        <MultiToggleBox
                            toggleAllIndexes={(indexesToToggle) => {
                                setParamsWithoutRefreshOptionsAndDefaults(prevParams => {
                                    const newColumns = [...prevParams.query_params.columns];
                                    const columnsToToggle = indexesToToggle.map(index => availableSnowflakeOptionsAndDefaults.config_options.columns[index]);
                                    columnsToToggle.forEach(sheetName => {
                                        toggleInArray(newColumns, sheetName);
                                    });

                                    return updateObjectWithPartialObject(prevParams, {query_params: {columns: newColumns}});
                                });
                            } }
                        >
                            {availableSnowflakeOptionsAndDefaults.config_options.columns.map((column, index) => {
                                const isToggled = params.query_params.columns.includes(column);
                                return (
                                    <MultiToggleItem
                                        key={column}
                                        title={column}
                                        toggled={isToggled}
                                        onToggle={() => {
                                            setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                                                const newColumns = [...prevParams.query_params.columns];
                                                toggleInArray(newColumns, column);
                                                return updateObjectWithPartialObject(prevParams, {query_params: {columns: newColumns}});
                                            });
                                        }}
                                        index={index} 
                                    />
                                );
                            })}
                        </MultiToggleBox>
                        <TextButton
                            disabled={
                                params.credentials.username.length === 0 || 
                                params.credentials.password.length === 0 || 
                                params.credentials.account.length === 0 || 
                                params.table_loc_and_warehouse.warehouse === undefined || 
                                params.table_loc_and_warehouse.database === undefined || 
                                params.table_loc_and_warehouse.schema === undefined ||
                                params.table_loc_and_warehouse.table === undefined 
                            }
                            disabledTooltip='Fields missing from the query. TODO: Cleanup'
                            onClick={() => edit()}
                            variant='dark'
                        >
                        </TextButton>
                    </>
                }
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default SnowflakeImportTaskpane;