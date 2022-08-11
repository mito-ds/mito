import React, { useEffect, useState } from 'react'
import MitoAPI from '../../jupyter/api';
import { Action, ActionEnum, AnalysisData, DFSource, SheetData, StepType, UserProfile } from '../../types'
import '../../../css/Checklist.css'
import Col from '../layout/Col';
import Row from '../layout/Row';
import { CHECKLIST_STEPS } from './checklistData';
import XIcon from '../icons/XIcon';
import RightArrowIcon from '../icons/RightArrowIcon';
import CheckmarkIcon from '../icons/CheckmarkIcon';
import EmptyCircleIcon from '../icons/EmptyCircleIcon';
import UpArrowIcon from '../icons/UpArrowIcon';
import DownArrowIcon from '../icons/DownArrowIcon';
import { classNames } from '../../utils/classNames';


export const getRemainingChecklistItems = (userProfile: UserProfile): string[] => {
    // As of now, we only have a single checklist, so we just check to see how much of this we have done
    const completedItems = userProfile.receivedChecklists['onboarding_checklist'] || [];
    return CHECKLIST_STEPS['onboarding_checklist'].filter(checklistItem => !completedItems.includes(checklistItem))
}

const getChecklistItemTitle = (item: string): string => {
    if (item === 'signup') {
        return 'Sign up for Mito'
    } else if (item === 'import') {
        return 'Import data'
    } else if (item === 'filter') {
        return 'Filter your dataframe'
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
    onClick?: () => void,
    href?: string
    completed?: boolean
}): JSX.Element => {
    return (
        <Row 
            justify='space-between' 
            align='center' 
            className={classNames('text-body-1', 'checklist-item', {'checklist-item-completed': props.completed})}
            onClick={() => {
                if (props.href) {
                    window.open(props.href, '_blank');
                } else if (props.onClick) {
                    props.onClick();
                }
            }}
        > 
            <Col className='mt-5px'>
                {props.index + 1}. {props.text}
            </Col>
            <Col className='mt-5px'>
                {props.icon}
            </Col>
        </Row>
    )
}



const ChecklistTODOItem = (props: {
    index: number,
    item: string,
    completed: boolean,
    action: Action | undefined
}): JSX.Element => {
    return (
        <ChecklistItem
            index={props.index}
            text={getChecklistItemTitle(props.item)}
            icon={props.completed ? <CheckmarkIcon/> : <EmptyCircleIcon/>}
            onClick={() => {props.action?.actionFunction()}}
            completed={props.completed}
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
            href={props.href}
        />
    )
}


const Checklist = (props: {
    userProfile: UserProfile
    analysisData: AnalysisData
    sheetDataArray: SheetData[]
    mitoAPI: MitoAPI,
    actions: Record<ActionEnum, Action>;
}): JSX.Element => {

    const [minimized, setMinimized] = useState(false);

    const allChecklistItemsAndActions: [string, Action | undefined][] = [
        ['signup', undefined],
        ['import', props.actions[ActionEnum.Import]],
        ['filter', props.actions[ActionEnum.Filter]],
        ['pivot', props.actions[ActionEnum.Pivot]],
        ['graph', props.actions[ActionEnum.Graph]],
        ['finalize', undefined]
    ];
    const allChecklistItems = allChecklistItemsAndActions.map(itemAndAction => itemAndAction[0]);
    const remainingChecklistItems = getRemainingChecklistItems(props.userProfile);
    const completedChecklistItems = allChecklistItems.filter(checklistItem => !remainingChecklistItems.includes(checklistItem));


    // This is the code that checks if any new steps have been completed in the checklist. 
    // We only have a single checklist for now, so we just manually check everything
    useEffect(() => {

        if (remainingChecklistItems.length === 0) {
            return;
        }

        if (remainingChecklistItems.includes('signup')) {
            if (props.userProfile.userEmail !== '' || props.userProfile.isPro) {
                void props.mitoAPI.updateChecklist('onboarding_checklist', ['signup'], false);
            }
        } 

        if (remainingChecklistItems.includes('import')) {
            if (props.sheetDataArray.length > 0) {
                void props.mitoAPI.updateChecklist('onboarding_checklist', ['import'], false);
            }
        }

        if (remainingChecklistItems.includes('filter')) {
            if (props.analysisData.stepSummaryList.filter(stepSummary => stepSummary.step_type === StepType.FilterColumn).length > 0) {
                void props.mitoAPI.updateChecklist('onboarding_checklist', ['filter'], false);
            }
        }

        if (remainingChecklistItems.includes('pivot')) {
            if (
                props.sheetDataArray.filter(sheetData => sheetData.dfSource === DFSource.Pivoted && sheetData.numColumns > 0).length > 0 // Check there is a pivoted dataframe with at least one column
            ) {
                void props.mitoAPI.updateChecklist('onboarding_checklist', ['pivot'], false);
            }
        }
        
        if (remainingChecklistItems.includes('graph')) {
            if (
                Object.values(props.analysisData.graphDataDict).filter(graphData => graphData.graphOutput !== undefined).length > 0 // Check there is at least one graph with a defined output
            ) {
                void props.mitoAPI.updateChecklist('onboarding_checklist', ['graph'], false);
            }
        }
    }, [props.analysisData.stepSummaryList])

    const ChecklistHeader = (
        <Row justify='space-between' align='center' suppressTopBottomMargin>
            <Col span={18} onClick={() => {setMinimized(!minimized)}}>
                <div className='text-header-2 text-color-white-important'>
                    Getting Started
                </div>
            </Col>
            <Col span={4.5}>
                <Row suppressTopBottomMargin>
                    <Col onClick={() => {
                        const newMinimized = !minimized;
                        setMinimized(newMinimized)
                        void props.mitoAPI.log('clicked_minimize_checklist', {minimized: newMinimized});
                    }} offsetRight={4}>
                        {minimized ? <UpArrowIcon variant='light'/> : <DownArrowIcon variant='light'/>}
                    </Col>
                    <XIcon
                        variant='light'
                        onClick={() => {
                            // If the user closes it, then mark the entire thing as finished
                            void props.mitoAPI.updateChecklist('onboarding_checklist', allChecklistItems, false);

                            if (remainingChecklistItems.length > 1) {
                                void props.mitoAPI.log('clicked_close_checklist_early', {remaining_checklist_items: remainingChecklistItems});
                            }
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
                            <NextStepItem index={0} text='Merge dataframes together' href='https://docs.trymito.io/how-to/merging-datasets-together'/>
                            <NextStepItem index={1} text='Write a spreadsheet formula' href='https://docs.trymito.io/how-to/interacting-with-your-data'/>
                            <NextStepItem index={2} text='Delete unecessary columns' href='https://docs.trymito.io/how-to/deleting-columns'/>
                            <NextStepItem index={3} text='Use the generated code' href='https://docs.trymito.io/how-to/using-the-generated-code'/>
                        </>

                    } 
                    {remainingChecklistItems.length > 1 &&
                        <>
                            {allChecklistItemsAndActions.map((itemAndAction, index) => {
                                if (index === allChecklistItems.length - 1) {
                                    return null;
                                }
                                const [item, action] = itemAndAction;
                                return (
                                    <ChecklistTODOItem
                                        key={index}
                                        index={index}
                                        item={item}
                                        action={action}
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