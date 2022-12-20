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

export type ConnectionInfo = {type: 'username/password', username: string, password: string, account: string};
type QueryParams = {warehouse: string, database: string, schema: string, table: string, columns: string[], limit: number};

interface SnowflakeImportParams {
    connection_info: ConnectionInfo,
    query_params: QueryParams,
}
const getDefaultParams = (): SnowflakeImportParams | undefined => {
    return {
        connection_info: {type: 'username/password', username: '', password: '', account: ''},
        query_params: {warehouse: '', database: '', schema: '', table: '', columns: [], limit: 0},
    }
}

export type ConnectionResult = {
    type: 'success',
    warehouses: string[],    
    databases: string[],    
    schemas: string[],    
    tables: string[],
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
    }, [params?.query_params.warehouse || '', params?.query_params.warehouse || '', params?.query_params.warehouse || '', params?.query_params.warehouse || ''])

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
                                value={params.connection_info.username} 
                                onChange={(e) => {
                                    const newUsername = e.target.value;
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'connection_info': {'username': newUsername}});
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
                                value={params.connection_info.password} 
                                type='password'
                                onChange={(e) => {
                                    const newUsername = e.target.value;
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'connection_info': {'password': newUsername}});
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
                                value={params.connection_info.account} 
                                onChange={(e) => {
                                    const newUsername = e.target.value;
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'connection_info': {'account': newUsername}});
                                    })
                                }}/>
                        </Col>
                    </Row>
                    <TextButton
                        disabled={params.connection_info.username.length === 0 || params.connection_info.password.length === 0 || params.connection_info.account.length === 0}
                        disabledTooltip='Please fill out the username, password, and account fields below.'
                        onClick={async () => {
                            const snowflakeConnection = await props.mitoAPI.getSnowflakeConnection({connection_info: params.connection_info});
                            setConnectionResult(snowflakeConnection);

                            

                            if (snowflakeConnection?.type === 'success') {
                                // Update the params to select the first warehouse, database, schema, table
                                // TODO: check if they are empty
                                setParams((prevParams) => {
                                    return updateObjectWithPartialObject(prevParams, {query_params: {
                                        warehouse: snowflakeConnection.warehouses[0],
                                        database: snowflakeConnection.databases[0],
                                        schema: snowflakeConnection.schemas[0],
                                        table: snowflakeConnection.tables[0],
                                    }})
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
                                value={params.query_params.warehouse}
                                onChange={(newWarehouse) => {
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'query_params': {'warehouse': newWarehouse}});
                                    })
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.warehouses.map((warehouse) => {
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
                                value={params.query_params.database}
                                onChange={(newDatabase) => {
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'query_params': {'database': newDatabase}});
                                    })
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.databases.map((database) => {
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
                                value={params.query_params.schema}
                                onChange={(newSchema) => {
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'query_params': {'schema': newSchema}});
                                    })
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.schemas.map((schema) => {
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
                                value={params.query_params.table}
                                onChange={(newTable) => {
                                    setParams((prevParams) => {
                                        return updateObjectWithPartialObject(prevParams, {'query_params': {'table': newTable}});
                                    })
                                }}
                            >
                                {connectionResult?.type === 'success' ? connectionResult.tables.map((table) => {
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
                    {columns.map((column, index) => {
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
                {/* TODO: add the user input for query_params of type Any */}

            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default SnowflakeImportTaskpane;