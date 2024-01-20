import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import Row from '../layout/Row';
import TextButton from './TextButton';

const MitoUpgradePrompt = (props: {
    message: string | undefined;
    proOrEnterprise: 'Pro' | 'Enterprise'
    mitoAPI: MitoAPI
    featureName?: string
}): JSX.Element => {

    const logClick = () => {
        void props.mitoAPI?.log('clicked_upgrade', {feature: props.featureName});
    }

    useEffect(() => {
        const logEventType = props.proOrEnterprise === 'Pro' ? 'prompted_pro_upgrade' : 'prompted_enterprise_upgrade';
        void props.mitoAPI.log(logEventType, {feature: props.featureName});
    }, [])

    return (
        <div>
            <Row justify='space-between' align='center'>
                <p className='text-body-1'>
                    {props.message || `This is a Mito ${props.proOrEnterprise} feature. To access all Mito ${props.proOrEnterprise} functionality, please upgrade.`}
                </p>  
            </Row>    
            <Row justify='center'>
                <TextButton href='https://trymito.io/plans' target='_blank' variant='dark' width='large' onClick={logClick}>
                    Upgrade to Mito {props.proOrEnterprise}
                </TextButton>
            </Row>
        </div>  
    )
}

export default MitoUpgradePrompt;