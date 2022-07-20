import React, { useEffect, useState } from 'react'
import MitoAPI from '../../jupyter/api';
import { AnalysisData, SheetData, StepType, UserProfile } from '../../types'
import '../../../css/Checklist.css'
import Checklist1Icon from '../icons/checklist/Checklist1Icon';
import Checklist2Icon from '../icons/checklist/Checklist2Icon';
import Checklist3Icon from '../icons/checklist/Checklist3Icon';
import Checklist4Icon from '../icons/checklist/Checklist4Icon';
import Checklist5Icon from '../icons/checklist/Checklist5Icon';
import Col from '../layout/Col';
import Row from '../layout/Row';
import { CHECKLIST_STEPS } from './checklistData';
import XIcon from '../icons/XIcon';
import RightArrowIcon from '../icons/RightArrowIcon';
import CheckmarkIcon from '../icons/CheckmarkIcon';
import EmptyCircleIcon from '../icons/EmptyCircleIcon';
import SmallUpArrowIcon from '../icons/SmallUpArrowIcon';
import SmallDownArrowIcon from '../icons/SmallDownArrowIcon';


export const getRemainingChecklistItems = (userProfile: UserProfile, analysisData: AnalysisData): string[] => {
    // As of now, we only have a single checklist, so we just check to see how much of this we have done
    const completedItems = userProfile.receivedChecklists['onboarding_checklist'] || [];
    return CHECKLIST_STEPS['onboarding_checklist'].filter(checklistItem => !completedItems.includes(checklistItem))
}

const getChecklistIcon = (remainingChecklistItems: string[]): JSX.Element => {
    if (remainingChecklistItems.length === 0) {
        return (<Checklist5Icon/>)
    } else if (remainingChecklistItems.length === 1) {
        return (<Checklist4Icon/>)
    } else if (remainingChecklistItems.length === 2) {
        return (<Checklist3Icon/>)
    } else if (remainingChecklistItems.length === 3) {
        return (<Checklist2Icon/>)
    } 
    return (<Checklist1Icon/>)
}

const getChecklistItemTitle = (item: string): string => {
    if (item === 'signup') {
        return 'Sign up'
    } else if (item === 'import') {
        return 'Import data'
    } else if (item === 'filter') {
        return 'Filter your dataset'
    } else if (item === 'pivot') {
        return 'Generate a pivot table'
    } else if (item === 'graph') {
        return 'Create a graph'
    }
    return 'Continue exploring'
}


const ChecklistItem = (props: {
    index: number,
    text: string,
    icon: JSX.Element,
    href: string
}): JSX.Element => {
    return (
        <Row 
            justify='space-between' 
            align='center' 
            className='text-body-1 text-color-white-important mt-5px'
            onClick={() => {
                window.open(props.href, '_blank');
            }}
        > 
            <Col>
                {props.index + 1}. {props.text}
            </Col>
            <Col>
                {props.icon}
            </Col>
        </Row>
    )
}



const ChecklistTODOItem = (props: {
    index: number,
    item: string,
    completed: boolean,
}): JSX.Element => {
    return (
        <ChecklistItem
            index={props.index}
            text={getChecklistItemTitle(props.item)}
            icon={props.completed ? <CheckmarkIcon/> : <EmptyCircleIcon/>}
            href={`https://docs.trymito.io/${props.item}`}
        />
    )
}

const NextStepItem = (props: {
    index: number,
    text: string,
    href: string
}): JSX.Element => {
    return (
        <ChecklistItem
            index={props.index}
            text={props.text}
            icon={<RightArrowIcon/>}
            href={`https://docs.trymito.io/`}
        />
    )
}


const Checklist = (props: {
    userProfile: UserProfile
    analysisData: AnalysisData
    sheetDataArray: SheetData[]
    mitoAPI: MitoAPI
}): JSX.Element => {

    const [minimized, setMinimized] = useState(false);

    const allChecklistItems = ['signup', 'import', 'filter', 'pivot', 'graph', 'finalize'];
    const remainingChecklistItems = getRemainingChecklistItems(props.userProfile, props.analysisData);
    const completedChecklistItems = allChecklistItems.filter(checklistItem => !remainingChecklistItems.includes(checklistItem));


    // This is the code that checks if any new steps have been completed in the checklist. 
    // We only have a single checklist for now, so we just manually check everything
    useEffect(() => {

        if (remainingChecklistItems.length === 0) {
            return;
        }

        if (remainingChecklistItems.includes('signup')) {
            if (props.userProfile.userEmail !== '') {
                props.mitoAPI.updateChecklist('onboarding_checklist', ['signup']);
            }
        } 

        if (remainingChecklistItems.includes('import')) {
            if (props.sheetDataArray.length > 0) {
                props.mitoAPI.updateChecklist('onboarding_checklist', ['import']);
            }
        }

        if (remainingChecklistItems.includes('filter')) {
            if (props.analysisData.stepSummaryList.filter(stepSummary => stepSummary.step_type === StepType.FilterColumn).length > 0) {
                props.mitoAPI.updateChecklist('onboarding_checklist', ['filter']);
            }
        }

        if (remainingChecklistItems.includes('pivot')) {
            if (props.analysisData.stepSummaryList.filter(stepSummary => stepSummary.step_type === StepType.Pivot).length > 0) {
                // TODO: do we also want to check if it is configured
                props.mitoAPI.updateChecklist('onboarding_checklist', ['pivot']);
            }
        }
        
        if (remainingChecklistItems.includes('graph')) {
            if (props.analysisData.stepSummaryList.filter(stepSummary => stepSummary.step_type === StepType.Graph).length > 0) {
                // TODO: do we also want to check if it is configured
                props.mitoAPI.updateChecklist('onboarding_checklist', ['graph']);
            }
        }
    }, [props.analysisData.stepSummaryList.length])

    const ChecklistHeader = (
        <Row justify='space-between' align='center' suppressTopBottomMargin>
            <Col span={18}>
                <Row justify='start' align='center' suppressTopBottomMargin>
                    <Col offsetRight={.5}>
                        {getChecklistIcon(remainingChecklistItems)}
                    </Col>
                    <Col>
                        <div className='text-header-2 text-color-white-important'>
                            Getting Started
                        </div>
                    </Col>
                </Row>
            </Col>
            <Col>
                <Row suppressTopBottomMargin>
                    <Col onClick={() => {setMinimized(!minimized)}} offsetRight={1}>
                        {minimized ? <SmallUpArrowIcon/> : <SmallDownArrowIcon/>}
                    </Col>
                    <XIcon
                        variant='light'
                        onClick={() => {
                            // If the user closes it, then mark the entire thing as finished
                            props.mitoAPI.updateChecklist('onboarding_checklist', allChecklistItems);
                        }}
                    />
                </Row>
            </Col>
        </Row>
    )



    return (
        <>
            {minimized && 
                <div className='checklist-container'>
                    {ChecklistHeader}
                </div>
            }
            {!minimized &&
                <div className='checklist-container'>
                    {ChecklistHeader}
                    {remainingChecklistItems.length === 1 && 
                        <>
                            <div className='text-body-1 text-color-white-important mt-10px mb-5px'>
                                <p>Good work getting started 🎉 There’s so much more to explore:</p>
                            </div>
                            <NextStepItem index={0} text='Merge dataframes together' href='https://docs.trymito.io'/>
                            <NextStepItem index={1} text='Write a spreadsheet formula' href='https://docs.trymito.io'/>
                            <NextStepItem index={2} text='Delete unecessary columns' href='https://docs.trymito.io'/>
                            <NextStepItem index={3} text='Use the generated code' href='https://docs.trymito.io'/>
                        </>

                    } 
                    {remainingChecklistItems.length > 1 &&
                        <>
                            {allChecklistItems.map((item, index) => {
                                if (index === allChecklistItems.length - 1) {
                                    return null;
                                }
                                return (
                                    <ChecklistTODOItem
                                        index={index}
                                        item={item}
                                        completed={completedChecklistItems.includes(item)}
                                    />
                                )
                            })}
                        </>
                    }
                </div>
            }
        </>
    )
}

export default Checklist;