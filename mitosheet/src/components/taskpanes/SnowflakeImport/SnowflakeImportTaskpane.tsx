import React, { useState } from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";
import { toggleInArray } from "../../../utils/arrays";
import { classNames } from "../../../utils/classNames";

import { updateObjectWithPartialObject } from "../../../utils/objects";
import AuthenticateToSnowflakeCard from "../../elements/AuthenticateToSnowflakeCard";
import DropdownItem from "../../elements/DropdownItem";
import Input from "../../elements/Input";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import LoadingCounter from "../../elements/LoadingCounter";
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

const LIMIT_TOOLTIP = 'Used to specify the number of rows to return. When working with large datasets, it might be helpful to begin with a subset of your data.'

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
    table_loc_and_warehouse: SnowflakeTableLocationAndWarehouse,
    query_params: SnowflakeQueryParams,
}

const getDefaultParams = (): SnowflakeImportParams | undefined => {
    return {
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
    const paramsCopy: SnowflakeImportParams = window.structuredClone(prevParams);
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

    const {params, setParams: setParamsWithoutRefreshOptionsAndDefaults, edit, loading: executingQuery} = useSendEditOnClick<SnowflakeImportParams, undefined>(
            () => getDefaultParams(),
            StepType.SnowflakeImport, 
            props.mitoAPI,
            props.analysisData,
    )

    const [credentialsValidated, setCredentialsValidated] = useState(false)
    const [credentialsSectionIsOpen, setCredentialsSectionIsOpen] = useState(true);
    const [availableSnowflakeOptionsAndDefaults, setAvailableSnowflakeOptionsAndDefaults] = useState<AvailableSnowflakeOptionsAndDefaults | undefined>(undefined);
    const [loadingOptionsAndDefaults, setLoadingOptionsAndDefaults] = useState(false)

    // Because we don't always want to refresh defaults, we have a setParamsWithoutDefaultRefresh function that will
    // set params without resetting the default values via the api call. This function, however, will both set the params and refresh the defaults.
    const setParamsAndRefreshOptionsAndDefaults = (newParams: SnowflakeImportParams): void => {
        setParamsWithoutRefreshOptionsAndDefaults(newParams);
        void loadAndSetOptionsAndDefaults(newParams);
    }

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const loadAndSetOptionsAndDefaults = async (newParams: SnowflakeImportParams) => {
        setLoadingOptionsAndDefaults(true)
        const availableSnowflakeOptionsAndDefaults = await props.mitoAPI.getAvailableSnowflakeOptionsAndDefaults(newParams.table_loc_and_warehouse);
        setAvailableSnowflakeOptionsAndDefaults(availableSnowflakeOptionsAndDefaults);

        if (availableSnowflakeOptionsAndDefaults?.type === 'success') {
            setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                return {
                    ...prevParams,
                    table_loc_and_warehouse: availableSnowflakeOptionsAndDefaults.default_values
                }
            })
        }
        setLoadingOptionsAndDefaults(false)
    }
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Import from Snowflake"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <AuthenticateToSnowflakeCard 
                    mitoAPI={props.mitoAPI}
                    onCredentialsValidated={() => {
                        setCredentialsSectionIsOpen(false)
                        setCredentialsValidated(true)
                        void loadAndSetOptionsAndDefaults(params)
                    }}      
                    isOpen={credentialsSectionIsOpen}          
                />
                <Spacer px={20}/>
                <CollapsibleSection 
                    title={(
                        <div className={classNames('text-header-3',{'text-color-gray-disabled': loadingOptionsAndDefaults})}>
                            Configure Query
                        </div>
                    )} 
                    open={availableSnowflakeOptionsAndDefaults?.type === 'success'}
                >
                    <Row justify="space-between">
                        <Col>
                            <p className={classNames({'text-color-gray-disabled': loadingOptionsAndDefaults})}>
                                Warehouse
                            </p>
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.table_loc_and_warehouse.warehouse || 'None available'}
                                disabled={loadingOptionsAndDefaults}
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
                            <p className={classNames({'text-color-gray-disabled': loadingOptionsAndDefaults})}>
                                Database
                            </p>
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.table_loc_and_warehouse.database || 'None available'}
                                disabled={loadingOptionsAndDefaults}
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
                            <p className={classNames({'text-color-gray-disabled': loadingOptionsAndDefaults})}>
                                Schema
                            </p>
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={params.table_loc_and_warehouse.schema || 'None available'}
                                disabled={loadingOptionsAndDefaults}
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
                            <p className={classNames({'text-color-gray-disabled': loadingOptionsAndDefaults})}>
                                Table
                            </p>
                        </Col>
                        <Col>
                            <Select
                                width="medium"
                                value={loadingOptionsAndDefaults ? "Loading.." : params.table_loc_and_warehouse.table || 'None available'}
                                disabled={loadingOptionsAndDefaults}
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
                    {loadingOptionsAndDefaults && 
                        <Row className={classNames('text-subtext-1')}>
                            <p>
                                Loading Snowflake options
                            </p>
                            <LoadingCounter />
                        </Row>
                    }
                </CollapsibleSection>
                <Row justify="start">
                    <p className="text-header-3">Columns to Import</p>
                </Row>
                {availableSnowflakeOptionsAndDefaults?.type === 'success' &&
                    <div>
                        <MultiToggleBox
                            disabled={loadingOptionsAndDefaults}
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
                        <Row justify='space-between' align='center' title={LIMIT_TOOLTIP}>
                            <Col>
                                <LabelAndTooltip tooltip={LIMIT_TOOLTIP}>
                                    Limit
                                </LabelAndTooltip>
                            </Col>
                            <Col>
                                <Input 
                                    width='medium' 
                                    value={params.query_params.limit?.toString() || ''} 
                                    placeholder='100000'
                                    disabled={loadingOptionsAndDefaults}
                                    onChange={(e) => {
                                        const newLimitNumber = parseInt(e.target.value) 
                                        setParamsWithoutRefreshOptionsAndDefaults((prevParams) => {
                                            return updateObjectWithPartialObject(prevParams, {query_params: {limit: newLimitNumber}});
                                        });
                                    }}
                                />
                            </Col>
                        </Row>
                        <TextButton
                            disabled={
                                !credentialsValidated || // Activated when user first validates credentials. Its possible they've since invalidated their credentials.
                                params.table_loc_and_warehouse.warehouse === undefined || 
                                params.table_loc_and_warehouse.database === undefined || 
                                params.table_loc_and_warehouse.schema === undefined ||
                                params.table_loc_and_warehouse.table === undefined 
                            }
                            disabledTooltip='Fill out all required fieldsd'
                            onClick={() => edit()}
                            variant='dark'
                        >
                            Run Query
                        </TextButton>
                        {executingQuery && 
                            <Row className={classNames('text-subtext-1')}>
                                <p>
                                    Executing query
                                </p>
                                <LoadingCounter />
                            </Row>
                        }
                    </div>
                }
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default SnowflakeImportTaskpane;