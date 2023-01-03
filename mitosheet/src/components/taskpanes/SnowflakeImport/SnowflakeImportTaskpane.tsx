import React, { useState } from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, ColumnID, SheetData, StepType, UIState, UserProfile } from "../../../types";
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

export type SnowflakeCredentials = {type: 'username/password', username: string, password: string, account: string};

export type SnowflakeConnection = {
    // TODO: These should be allowed to be undefined
    warehouse: string | undefined, 
    database: string | undefined, 
    schema: string | undefined,
}

export type SnowflakeQueryParams = {
	table: string | undefined,
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
        connection: {warehouse: undefined, database: undefined, schema: undefined},
        query_params: {table: undefined, columns: [], limit: undefined},
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
    const [openConnectionSection, setOpenConnectionSection] = useState(true);
    const [connectionResult, setConnectionResult] = useState<ConnectionResult | undefined>(undefined);

    const [columns] = useStateFromAPIAsync<ColumnID[], string>([], (warehouse: string, database: string, schema: string, table: string) => {
        if (warehouse !== '' && database !== '' && schema !== ''&& table !== '') {
            return props.mitoAPI.getSnowflakeColumns({warehouse: warehouse, database: database, schema: schema, table: table});
        } else {
            return new Promise((resolve) => resolve([]));
        }
    }, (columns) => {
        // TODO: we need to only refresh this when the actual initial params
        setParams((prevParams) => {
            return updateObjectWithPartialObject(prevParams, {'query_params': {'columns': columns}});
        })
    }, [params?.connection.warehouse || '', params?.connection.warehouse || '', params?.connection.warehouse || '', params?.connection.warehouse || ''])

    // TODO: The line above should certainly not be all warehouse. Figure out what is going on there!!

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Import from Snowflake"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <CollapsibleSection title='Connection' open={openConnectionSection}>
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
                        onClick={async () => {
                            const snowflakeConnection = await props.mitoAPI.getSnowflakeConnection(params);
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
                                setOpenConnectionSection(false);
                            }
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
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'connection': {'database': newDatabase}});
                                    })
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
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'connection': {'schema': newSchema}});
                                    })
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
                                value={params.query_params.table || 'None available'}
                                onChange={(newTable) => {
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'query_params': {'table': newTable}});
                                    })
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
                                const columnsToToggle = indexesToToggle.map(index => columns[index]);
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