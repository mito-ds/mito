import React from 'react';
import Row from '../layout/Row';
import TextButton from './TextButton';

const MitoProUpgradePrompt = (props: {
    message: string | undefined;
}): JSX.Element => {
    return (
        <div>
            <Row justify='space-between' align='center'>
                <p className='text-body-1'>
                    {props.message || 'This is a Mito Pro feature. To access all Mito Pro functionality, please upgrade.'}
                </p>  
            </Row>    
            <Row justify='center'>
                <TextButton href='https://trymito.io/plans' target='_blank' variant='dark' width='large'>
                    Upgrade to Mito Pro
                </TextButton>
            </Row>
        </div>  
    )
}

export default MitoProUpgradePrompt;