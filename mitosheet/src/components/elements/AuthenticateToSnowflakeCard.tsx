// Copyright (c) Mito
import React, { useEffect, useState } from 'react';
import MitoAPI from '../../jupyter/api';
import { classNames } from '../../utils/classNames';
import { updateObjectWithPartialObject } from '../../utils/objects';
import '../../../css/layout/CollapsibleSection.css'

import Col from '../layout/Col';
import CollapsibleSection from '../layout/CollapsibleSection';
import Row from '../layout/Row';
import { SnowflakeCredentials } from '../taskpanes/SnowflakeImport/SnowflakeImportTaskpane';
import Input from './Input';
import LoadingCounter from './LoadingCounter';
import TextButton from './TextButton';

export type SnowflakeCredentialsValidityCheckResult = {type: 'success'} | {type: 'error', 'error_message': string}

const getDefaultCredentials = (): SnowflakeCredentials => {
    return {type: 'username/password', username: '', password: '', account: ''}
}

/**
    * A card that handles all work required to authenticate a user to snowflake
*/ 

const AuthenticateToSnowflakeCard = (props: {
    mitoAPI: MitoAPI;
    onValidCredentials: () => void;
    onInvalidCredentials?: () => void;
    isOpen: boolean
}): JSX.Element => {

    const [credentials, setCredentials] = useState<SnowflakeCredentials>(() => getDefaultCredentials())
    const [snowflakeCredentialsValidityCheckResult, setSnowflakeCredentialsValidityCheckResult] = useState<SnowflakeCredentialsValidityCheckResult | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        // On first render, load the cached credentials
        setLoading(true)
        void loadAndSetAndValidateCachedCredentials()
    }, []);

    const loadAndSetAndValidateCachedCredentials = async () => {
        const cachedCredentials = await props.mitoAPI.getCachedSnowflakeCredentials()
        if (cachedCredentials !== undefined) {
            setCredentials(cachedCredentials)
            void _validateSnowflakeCredentials(cachedCredentials)
        }
        setLoading(false)
    }

    const validateSnowflakeCredentialsParams = async () => {
        setLoading(true)
        void _validateSnowflakeCredentials(credentials)
    }

    const _validateSnowflakeCredentials = async (credentials: SnowflakeCredentials) => {
        const credentialsValidityCheckResult = await props.mitoAPI.validateSnowflakeCredentials(credentials);
        setSnowflakeCredentialsValidityCheckResult(credentialsValidityCheckResult)
        if (credentialsValidityCheckResult?.type === 'success') {
            props.onValidCredentials()
        } else if (props.onInvalidCredentials !== undefined) {
            props.onInvalidCredentials()
        }
        setLoading(false)
    }

    return (
        <div className='mito-collapsible-content-card-container'>
            <CollapsibleSection 
                title={(
                    <div className={classNames('text-header-3',{'text-color-gray-disabled': loading})}>
                        Connection
                    </div>
                )}
                open={props.isOpen}
            >
                <Row justify="space-between">
                    <Col>
                        <p className={classNames({'text-color-gray-disabled': loading})}>
                            Username
                        </p>
                    </Col>
                    <Col>
                        <Input 
                            value={credentials.username} 
                            disabled={loading}
                            onChange={(e) => {
                                const newUsername = e.target.value;
                                setCredentials((prevCredentials) => {
                                    return updateObjectWithPartialObject(prevCredentials, {username: newUsername});
                                }) 
                            }}/>
                    </Col>
                </Row>
                <Row justify="space-between">
                    <Col>
                        <p className={classNames({'text-color-gray-disabled': loading})}>
                            Password
                        </p>
                    </Col>
                    <Col>
                        <Input 
                            value={credentials.password} 
                            type='password'
                            disabled={loading}
                            onChange={(e) => {
                                const newPassword = e.target.value;
                                setCredentials((prevCredentials) => {
                                    return updateObjectWithPartialObject(prevCredentials, {password: newPassword});
                                }) 

                            }}/>
                    </Col>
                </Row>
                <Row justify="space-between">
                    <Col>
                        <p className={classNames({'text-color-gray-disabled': loading})}>
                            Account
                        </p>
                    </Col>
                    <Col>
                        <Input 
                            value={credentials.account} 
                            disabled={loading}
                            onChange={(e) => {
                                const newAccount = e.target.value;
                                setCredentials((prevCredentials) => {
                                    return updateObjectWithPartialObject(prevCredentials, {account: newAccount});
                                }) 
                            }}/>
                    </Col>
                </Row>
                {/* TODO: Make pressing enter if they have not yet connected submit this button? */}
                <TextButton
                    disabled={credentials.username.length === 0 || credentials.password.length === 0 || credentials.account.length === 0 || loading}
                    disabledTooltip='Please fill out the username, password, and account fields below.'
                    onClick={async () => {
                        await validateSnowflakeCredentialsParams();
                    }}
                    variant='dark'
                >
                    Connect to Snowflake
                </TextButton>
            </CollapsibleSection>
            {!loading && snowflakeCredentialsValidityCheckResult !== undefined &&
                <div className={(classNames({'text-color-error': snowflakeCredentialsValidityCheckResult.type === 'error' , 'text-color-success': snowflakeCredentialsValidityCheckResult.type === 'success'}, 'mito-collapsible-content-card-subtext'))}>
                    {snowflakeCredentialsValidityCheckResult.type === 'success' && "Successfully connected to Snowflake instance."}
                    {snowflakeCredentialsValidityCheckResult.type === 'error' && snowflakeCredentialsValidityCheckResult.error_message}
                </div>
            }
            {loading && 
                <Row suppressTopBottomMargin className={classNames('text-subtext-1', 'mito-collapsible-content-card-subtext')}>
                    <p>
                        Connecting to Snowflake
                    </p>
                    <LoadingCounter />
                </Row>
            }
        </div>
    )
} 

export default AuthenticateToSnowflakeCard;