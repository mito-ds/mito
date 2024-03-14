// Copyright (c) Mito

import React, { FormEvent, useState } from 'react';
import { ModalEnum } from './modals';
import { MitoAPI } from '../../api/api';
import BlueMitoFolk from '../icons/mitofolks/BlueMitoFolk';
import PinkMitoFolk from '../icons/mitofolks/PinkMitoFolk';
import YellowMitoFolk from '../icons/mitofolks/YellowMitoFolk';

import '../../../../css/signup-modal.css';
import TextButton from '../elements/TextButton';
import Input from '../elements/Input';
import { AnalysisData, FeedbackID, SheetData, UIState } from '../../types';
import { checkProAccessCode } from '../../utils/pro';
import Experiment from '../elements/Experiment';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { classNames } from '../../utils/classNames';

/* 
    This file contains all the screens used in the signup modal. As these
    are only used in this one file, we keep them together for cleanlyness.
*/


// The first question we ask on the signup page
const FirstQuestion = 'Your Company/Organization';
const FirstPlaceholder = 'AppleSoftBook';


/* Step one requires an email input */
const StepOne = (
    props: {
        next: () => void,
        email: string, 
        setEmail: (email: string) => void,
        firstResponse: string,
        setFirstResponse: (firstResponse: string) => void,
        mitoAPI: MitoAPI,
    }): JSX.Element => {

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await props.mitoAPI.updateSignUp(props.email);
        props.next();
    }

    return (
        <div className='signup-modal-left-column'>
            <div>
                <h1 className='text-header-1' style={{margin: 0}}>
                    Sign Up for Mito
                </h1>
                <p className='signup-modal-text' style={{marginTop: '10px'}}>
                    We&apos;ll send you product updates, relevant documentation, and case studies. 
                </p>
            </div>
            <form className='signup-modal-email-form' onSubmit={onSubmit}>
                <p className='text-body-1' style={{marginTop: '10px', marginBottom: 0}}>
                    Work Email
                </p>
                <Input
                    value={props.email}
                    onChange={(event) => {props.setEmail(event.target.value)}}
                    type='email'
                    width='large'
                    placeholder='jake.diamond@apple.com' 
                    required
                    autoFocus
                />
                <label>
                    <p className='text-body-1' style={{marginTop: '10px', marginBottom: 0}}>
                        {FirstQuestion}
                    </p>
                </label>
                <Input
                    value={props.firstResponse}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {props.setFirstResponse(e.target.value)}}
                    placeholder={FirstPlaceholder}
                    required
                    style={{marginBottom: '10px'}}
                />
                <div className='mt-10px' style={{marginTop: '10px'}}>
                    <TextButton
                        variant='dark'
                        width='large'
                        type='submit'
                    >
                        Sign Up
                    </TextButton>
                </div>
            </form>
        </div>
    )
}


/**
 * Step one requires the user to read the privacy policy, and optionally
 * gives the user the chance to sign up for Mito pro. 
 * 
 * We make this part of step two rather than a whole new step in it's own 
 * right as it is branches, and we don't want to deal with that complexity
 * in the main signup flow.
*/ 
const StepTwo = (
    props: {
        back: () => void;
        next: () => void;
        isPro: boolean;
        mitoAPI: MitoAPI;
        analysisData: AnalysisData
    }): JSX.Element => {

    // We cache isPro so that if the user signs up for pro we can
    // update this immediately with no lag
    const [isPro, setIsPro] = useState(props.isPro); 
    const [enteringProAccessCode, setEnteringProAccessCode] = useState(false);

    const [accessCode, setAccessCode] = useState('');
    const [invalidAccessCode, setInvalidAccessCode] = useState(false);

    const attemptSubmitAccessCode = () => {
        if (!checkProAccessCode(accessCode)) {
            setInvalidAccessCode(true)
            return;
        }

        setInvalidAccessCode(false);
        setEnteringProAccessCode(false);
        setIsPro(true);

        // We log this before going pro so that this is the last thing to appear in the logs
        void props.mitoAPI.log('signup_completed_pro', {'location': 'signup'})
        void props.mitoAPI.updateGoPro();

        // Then, we go to the final page
        props.next();
    }

    return (
        <>
            {!enteringProAccessCode &&
                <div className='signup-modal-left-column'>
                    <div>
                        <h1 className='text-header-1' style={{marginTop: 0, marginBottom: 0}}>
                            {isPro 
                                ? "You've Signed up for Mito Pro!" 
                                : "Want More Power? Consider Mito Pro"
                            }
                        </h1>
                        <p className='signup-modal-text' style={{marginTop: '10px'}}>
                            {isPro 
                                ? "Thanks for being a Mito Pro user! Paying for Mito gets you access to advanced functionality and turns off telemetry. In turn, it allows us to fund Mito's development." 
                                : "Mito Pro gives you access to advanced functionality, and allows you to turn off telemetry. It also allows us to continue to fund Mito's development!"
                            }
                        </p>
                    </div>
                    {!isPro &&
                        <div className='signup-modal-buttons' style={{marginTop: '10px'}}>
                            <TextButton
                                variant='light'
                                width='small'
                                onClick={props.back}
                            >
                                Back
                            </TextButton>
                            <TextButton
                                variant='dark'
                                width='small'
                                href='https://trymito.io/plans'
                                target='_blank'
                                onClick={() => {
                                    setEnteringProAccessCode(true);
                                    void props.mitoAPI.log('signup_clicked_pro');
                                }}
                            >
                                See Plans
                            </TextButton>
                            <TextButton
                                variant='dark'
                                width='small'
                                onClick={props.next}
                                autoFocus
                            >
                                <Experiment analysisData={props.analysisData} experimentID='title_name' aElement='No Thanks' bElement='Skip'/>
                            </TextButton>
                        </div> 
                    }
                    {isPro &&
                        <div className='signup-modal-buttons' style={{marginTop: '10px'}}>
                            <TextButton
                                variant='light'
                                width='small'
                                onClick={props.back}
                            >
                                Back
                            </TextButton>
                            <TextButton
                                variant='dark'
                                width='small'
                                onClick={props.next}
                                autoFocus
                            >
                                Continue
                            </TextButton>
                        </div> 
                    }
                    
                </div>
            }
            {enteringProAccessCode &&
                <div className='signup-modal-left-column'>
                    <div>
                        <h1 className='text-header-1' style={{marginTop: 0, marginBottom: 0}}>
                            Access Pro
                        </h1>
                        <p className='signup-modal-text'>
                            Complete the checkout flow. In the Pro documentation, click <b>Get Access Code</b> and enter it here.
                        </p>
                        <label>
                            <h3 className='text-header-2' style={{marginTop: '5px', marginBottom: 0}}>
                                Access Code:
                            </h3>
                        </label>
                        <Input 
                            placeholder='mito-pro-access-code-XXXXXXXXXXXX'
                            value={accessCode} 
                            onChange={(e) => {setAccessCode(e.target.value)}}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    attemptSubmitAccessCode()
                                }
                            }}
                        />
                        {invalidAccessCode &&
                            <p className='signup-modal-text signup-modal-text-error'>
                                Invalid access code
                            </p>
                        }
                    </div>
                    <div className='signup-modal-buttons' style={{marginTop: '10px'}}>
                        <TextButton
                            variant='light'
                            width='small'
                            onClick={() => {
                                setEnteringProAccessCode(false);
                            }}
                        >
                            Back
                        </TextButton>
                        <TextButton
                            variant='dark'
                            width='small'
                            onClick={attemptSubmitAccessCode}
                            autoFocus
                        >
                            Submit
                        </TextButton>
                    </div> 
                </div>
            }
        </>
    )
}

/* Step three asks the user want they want to use Mito for */
const StepThree = (
    props: {
        back: () => void;
        next: () => void;
        firstResponse: string;
        numUsages: number
        mitoAPI: MitoAPI;
        isPro: boolean;
    }): JSX.Element => {

    const onSubmit = async () => {

        // Log the answers to the questions each as their own piece of feedback
        await props.mitoAPI.updateFeedback(FeedbackID.COMPANY, props.numUsages, [{'question': FirstQuestion, 'answer': props.firstResponse}]);
        

        // Advance to the next step
        props.next();
    }

    return (
        <div className='signup-modal-left-column'>
            <div>
                <h1 className='text-header-1' style={{marginTop: 0, marginBottom: 0}}>
                    {props.isPro && `Mito Pro is Totally Private`}
                    {!props.isPro && `Mito is Built for Privacy`}
                </h1>
                <p className='signup-modal-text' style={{marginTop: '10px'}}>
                    {props.isPro && `As a Mito Pro user, no data leaves your computer, ever. Check out our CCPA compliant privacy policy`}
                    {!props.isPro && `We make sure none of your private data leaves your computer. Read our CCPA compliant privacy policy`}
                    {' '} <a className='text-link' href='https://privacy.trymito.io/privacy-policy' target='_blank' rel="noreferrer"><u>here</u></a>.
                </p>
            </div>
            <div className='signup-modal-buttons' style={{marginTop: '10px'}}>
                <TextButton
                    variant='light'
                    width='small'
                    onClick={props.back}
                >
                    Back
                </TextButton>
                <TextButton
                    variant='dark'
                    width='small'
                    onClick={onSubmit}
                    autoFocus
                >
                    Accept
                </TextButton>
            </div> 
        </div>
    )
}


/* 
    First signup modal, which collects the users email, shows them the privacy policy, 
    and then asks them what they want to do with the tool.
*/
const SignupModal = (
    props: {
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI;
        numUsages: number;
        isPro: boolean;
        sheetDataArray: SheetData[]
        analysisData: AnalysisData;
    }): JSX.Element => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');

    // Store the first and second response here, so if they use the back button, their answers are stored
    const [firstResponse, setFirstResponse] = useState('');

    const next = () => {
        // Note that if the user is pro, we don't show them the final signup step
        // as we don't collect that data anyways
        if (step + 1 > 3) {
            props.setUIState((prevUIState) => {
                return {
                    ...prevUIState,
                    currOpenModal: {type: ModalEnum.None},
                    currOpenTaskpanel: {type: TaskpaneType.IMPORT_FILES},
                }
            })
            void props.mitoAPI.log('finished_signup');
        } else {
            const newStep = Math.min(step + 1, 3);
            setStep(newStep)
            void props.mitoAPI.log('switched_signup_step', 
                {
                    'old_signup_step': step,
                    'new_signup_step': newStep
                }
            );
        }
    }
    const back = () => {
        const newStep = Math.max(step - 1, 0);
        setStep(newStep)

        void props.mitoAPI.log('switched_signup_step', 
            {
                'old_signup_step': step,
                'new_signup_step': newStep
            }
        );
    }   

    // Background colors of the different steps right column
    const backgroundColors: Record<number, string> = {
        1: '#FFEBEB',
        2: '#F0C5BB',
        3: '#FFDAAE',
    }

    return (
        <div className='overlay'>
            <div className={classNames('signup-modal-container')}>
                <div className='signup-modal-left-column-container'>
                    {step === 1 &&
                        <StepOne
                            next={next}
                            email={email}
                            setEmail={setEmail}
                            firstResponse={firstResponse}
                            setFirstResponse={setFirstResponse}
                            mitoAPI={props.mitoAPI}
                        />
                    }
                    {step === 2 &&
                        <StepTwo
                            next={next}
                            back={back}
                            isPro={props.isPro}
                            mitoAPI={props.mitoAPI}
                            analysisData={props.analysisData}
                        />
                    }
                    {step === 3 &&
                        <StepThree
                            next={next}
                            back={back}
                            firstResponse={firstResponse}
                            numUsages={props.numUsages}
                            mitoAPI={props.mitoAPI}
                            isPro={props.isPro}
                        />
                    }
                    
                </div>
                <div className='signup-modal-right-column-container' style={{backgroundColor: backgroundColors[step]}}>
                    {step === 1 &&
                        <PinkMitoFolk/>
                    }
                    {step === 2 &&
                        <BlueMitoFolk/>
                    }
                    {step === 3 &&
                        <YellowMitoFolk/>
                    }
                </div>
            </div>
        </div>
    );
};

export default SignupModal;