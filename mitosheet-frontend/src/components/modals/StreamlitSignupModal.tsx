// Copyright (c) Mito

import React, { FormEvent, useState } from 'react';
import { MitoAPI } from '../../api/api';
import BlueMitoFolk from '../icons/mitofolks/BlueMitoFolk';
import PinkMitoFolk from '../icons/mitofolks/PinkMitoFolk';
import { ModalEnum } from './modals';

import '../../../css/signup-modal.css';
import { AnalysisData, SheetData, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import TextButton from '../elements/TextButton';
import { TaskpaneType } from '../taskpanes/taskpanes';

const StepOne = (
    props: {
        next: () => void;
        mitoAPI: MitoAPI;
    }): JSX.Element => {

    const [email, setEmail] = useState('');

    
    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await props.mitoAPI.updateSignUp(email);
        props.next();
    }

    return (
        <div className='signup-modal-left-column'>
            <div>
                <h1 className='text-header-1' style={{margin: 0}}>
                    Sign up for Mito
                </h1>
                <p className='text-header-2 text-color-medium-important text-font-family-normal-important' style={{marginTop: '10px'}}>
                    We’ll send you periodic product updates and welcome any feedback.
                </p>
                <p className='text-header-2 text-color-medium-important text-font-family-normal-important' style={{marginTop: '10px'}}>
                    This modal appears the first time you use Mito for Streamlit on a computer.
                </p>
            </div>
            <form className='signup-modal-email-form' onSubmit={onSubmit}>
                <p className='text-header-2' style={{marginTop: '10px', marginBottom: 0}}>
                    Email
                </p>
                <Input
                    value={email}
                    onChange={(event) => {setEmail(event.target.value)}}
                    type='email'
                    width='large'
                    placeholder='example@gmail.com' 
                    required
                    autoFocus
                />
                <div className='mt-10px' style={{marginTop: '10px'}}>
                    <TextButton
                        variant='dark'
                        width='block'
                        type='submit'
                    >
                        Next
                    </TextButton>
                </div>
            </form>
        </div>
    )
}



const StepTwo = (
    props: {
        back: () => void;
        next: () => void;
        mitoAPI: MitoAPI;
        isPro: boolean;
    }): JSX.Element => {

    return (
        <div className='signup-modal-left-column'>
            <div>
                <h1 className='text-header-1' style={{marginTop: 0, marginBottom: 0}}>
                    {props.isPro && `Mito Pro is Totally Private`}
                    {!props.isPro && `Built for Privacy`}
                </h1>
                <p className='text-header-2 text-font-family-normal-important' style={{marginTop: '10px'}}>
                    {props.isPro && `As a Mito Pro user, no data leaves your computer, ever. Check out our CCPA compliant privacy policy`}
                    {!props.isPro && `We take no private data. We collect basic information about usage. Read our CCPA compliant`}
                    {' '} <a className='text-link' href='https://privacy.trymito.io/privacy-policy' target='_blank' rel="noreferrer"><u>privacy policy.</u></a>
                </p>
                {!props.isPro &&
                    <p className='text-header-2 text-font-family-normal-important' style={{marginTop: '10px'}}>
                        See <a className='text-link' href='https://trymito.io/plans' target='_blank' rel="noreferrer"><u>Mito Pro or Mito Enterprise</u></a> to remove all telemetry.
                    </p>
                }
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
                    onClick={props.next}
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
const StreamlitSignupModal = (
    props: {
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI;
        numUsages: number;
        isPro: boolean;
        sheetDataArray: SheetData[]
        analysisData: AnalysisData;
    }): JSX.Element => {
    const [step, setStep] = useState(1);

    const next = () => {
        if (step + 1 > 2) {
            props.setUIState((prevUIState) => {
                return {
                    ...prevUIState,
                    currOpenModal: {type: ModalEnum.None},
                    currOpenTaskpanel: {type: TaskpaneType.IMPORT_FILES},
                }
            })
        } else {
            const newStep = Math.min(step + 1, 2);
            setStep(newStep)
        }
    }
    const back = () => {
        const newStep = Math.max(step - 1, 0);
        setStep(newStep)
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
                            mitoAPI={props.mitoAPI}
                        />
                    }
                    {step === 2 &&
                        <StepTwo
                            next={next}
                            back={back}
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
                </div>
            </div>
        </div>
    );
};

export default StreamlitSignupModal;