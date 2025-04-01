/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from "react";
import { MitoAPI } from "../../../api/api";
import { useInputValue } from "../../../hooks/useInputValue";
import { UIState, UserProfile } from "../../../types"
import { classNames } from "../../../utils/classNames";
import { checkProAccessCode } from "../../../utils/pro";
import Input from "../../elements/Input";
import TextButton from "../../elements/TextButton";
import Tooltip from "../../elements/Tooltip";
import HighlightCheckMark from "../../icons/HighlightCheckMark";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";



interface UpgradeTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    proOrEnterprise: 'Pro' | 'Enterprise'
}

const ProListElement = (props: {text: string}): JSX.Element => {
    return (
        <Row>
            <Col span={2}>
                <HighlightCheckMark/>
            </Col>
            <p className="text-body-1">
                {props.text}
            </p>
        </Row>
    )
}

/* 
    This taskpane allows users to upgrade to pro, or tells them they
    are already upgraded (if they are).
*/
const UpgradeToProTaskpane = (props: UpgradeTaskpaneProps): JSX.Element => {

    const [isEnteringAccessCode, setIsEnteringAccessCode] = useState(false);
    const accessCodeInput = useInputValue('', 'mito-pro-access-code-ASKDJQWDKQWDLL')
    const [invalidAccessCode, setInvalidAccessCode] = useState(false);

    const isPro = props.userProfile.isPro;

    useEffect(() => {
        void props.mitoAPI.log('opened_upgrade_to_pro_taskpane');
    }, [])


    if (!isPro && !isEnteringAccessCode) {
        return (
            <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
                <DefaultTaskpaneHeader 
                    header="Upgrade to Mito Pro"
                    setUIState={props.setUIState}            
                />
                <DefaultTaskpaneBody>
                    <p className="text-body-1 mb-10px">
                        <a href='https://trymito.io/plans' target='_blank' rel="noreferrer"><span className='text-body-1-link'>Mito Pro</span></a> gives you extra features to super charge your analysis:
                    </p>
                    <ProListElement text="Turn off all telemetry"/>
                    <ProListElement text="Generated code optimization"/>
                    <ProListElement text="Import from external drives"/>
                    <ProListElement text="Format datframes"/>
                    <ProListElement text="Style graphs"/>
                    <ProListElement text="Priority support"/>
                    <ProListElement text="All future pro functionality!"/>
                    <div className="mt-25px">
                        <Row justify="space-around">
                            {/* The Stripe link is no normal link, and requires a POST, so we're required to use a form to allow users to click on it */}
                            <form className='element-width-block' action="https://jl76z192i0.execute-api.us-east-1.amazonaws.com/Prod/create_checkout_session/" method="POST" target="_blank">
                                <button 
                                    className={classNames('text-button', 'text-header-3', 'text-overflow-wrap', 'element-width-block', 'text-button-variant-dark')} 
                                    type="submit"
                                    onClick={() => {
                                        void props.mitoAPI.log('clicked_purchase_mito_pro');
                                        // A little hack to make sure the post is sent before we move to the next page
                                        setTimeout(() => setIsEnteringAccessCode(true), 100)
                                    }}
                                >
                                    Purchase Mito Pro
                                </button>
                            </form>
                        </Row>
                        <Row justify="space-around" className="mb-5px mt-5px">
                            <p className="text-body-1">
                                Or
                            </p>
                        </Row>
                        <Row justify="space-around">
                            <TextButton variant='dark' onClick={() => {setIsEnteringAccessCode(true)}}>
                                Enter Access Code
                            </TextButton>
                        </Row>
                    </div>
                </DefaultTaskpaneBody>
            </DefaultTaskpane>
        )
    } else if (!isPro && isEnteringAccessCode) {
        return (
            <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
                <DefaultTaskpaneHeader 
                    header="Enter Access Code"
                    setUIState={props.setUIState}            
                />
                <DefaultTaskpaneBody>
                    <Row align="center" justify="start">
                        <Col>
                            <p className="text-heading-2">
                                Access Code: 
                            </p>
                        </Col>
                        <Col>
                            <Tooltip title="Get an access code by purchasing a Pro license on the previous page."/>
                        </Col>
                    </Row>
                    <Input {...accessCodeInput}/>
                    {invalidAccessCode && 
                        <div className="text-color-error">
                            Sorry, that access code is invalid. Purchase Mito Pro from the previous page and then enter the access code here.
                        </div>
                    }
                    <Spacer px={20}/>
                    <Row justify="space-around">
                        <Col>
                            <TextButton variant='light' onClick={() => {setIsEnteringAccessCode(false)}}>
                                Back
                            </TextButton>
                        </Col>
                        <Col>
                            <TextButton 
                                variant='dark' 
                                onClick={async () => {
                                    if (!checkProAccessCode(accessCodeInput.value)) {
                                        setInvalidAccessCode(true)
                                        return;
                                    }
                                    setInvalidAccessCode(false);
                                    
                                    await props.mitoAPI.log('signup_completed_pro', {'location': 'upgrade_to_pro_taskpane'});
                                    await props.mitoAPI.updateGoPro();

                                    setIsEnteringAccessCode(false);
                                }}
                            >
                                Submit Access Code
                            </TextButton>
                        </Col>
                    </Row>
                </DefaultTaskpaneBody>
            </DefaultTaskpane>
        )
    } else {
        return (
            <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
                <DefaultTaskpaneHeader 
                    header={`Welcome to Mito ${props.proOrEnterprise}!`}
                    setUIState={props.setUIState}            
                />
                <DefaultTaskpaneBody>
                    <p className="text-heading-4 mb-10px">
                        {props.proOrEnterprise === 'Pro' 
                            ? 'You\'ve successfully upgraded to Mito Pro. You can cancel any time by sending us an email.' 
                            : 'Mito Enterprise is the fastest way to automate any Python analysis.'
                        }
                    </p>
                    <ProListElement text="All telemetry is off"/>
                    <ProListElement text="Generated code is being optimized"/>
                    <ProListElement text="Style graphs"/>
                    <ProListElement text="Format dataframes"/>
                    <ProListElement text="Export formatting"/>
                    <ProListElement text="Get priority support"/>
                    <ProListElement text={`All future ${props.proOrEnterprise} functionality!`}/>
                </DefaultTaskpaneBody>
            </DefaultTaskpane>
        )
    }
}

export default UpgradeToProTaskpane;