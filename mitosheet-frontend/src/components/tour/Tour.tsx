// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import "../../../css/tour.css"
import { MitoAPI } from '../../api/api';
import TextButton from '../elements/TextButton';
import { TourName, TourPopupLocation, tours, TourStep } from './Tours';
import { classNames } from '../../utils/classNames';
import Row from '../layout/Row';
import Col from '../layout/Col';
import { SheetData } from '../../types';


const locationToClassNamesMapping: Record<TourPopupLocation, string> = {
    [TourPopupLocation.BOTTOM_LEFT]: 'tour-container-bottom-left',
    [TourPopupLocation.BOTTOM_RIGHT]: 'tour-container-bottom-right',
    [TourPopupLocation.TOP_LEFT]: 'tour-container-top-left',
    [TourPopupLocation.TOP_RIGHT]: 'tour-container-top-right',
}

const Tour = (props: {
    mitoAPI: MitoAPI;
    sheetData: SheetData | undefined;
    // TODO: When we make the buttons into components, give them each a highlight props and combine the following two functions
    setHighlightPivotTableButton: (highlight: boolean) => void;
    setHighlightAddColButton: (highlight: boolean) => void; 
    tourNames: TourName[];
}): JSX.Element => {
    const [stepNumber, setStepNumber] = useState<number>(0)
    const [skippedTour] = useState<boolean>(false)

    // Construct full list of steps to show by appending the steps of each tour
    // we want to display together. 
    const steps: TourStep[] = []
    props.tourNames.forEach((tourName: TourName) => {
        steps.push(...tours[tourName])
    });

    // Log the beginning of the tour. Because the useEffect has [] as
    // its second param, it only runs once. 
    useEffect(() => {
        void props.mitoAPI.log(
            'begin_tour',
            {
                'tour_names': props.tourNames,
                'total_number_of_tour_steps': steps.length
            }
        )
    }, []);

    /* 
        Each tour is able to register actions that occur at the beginning of specific steps.
        The useEffect is fired each time the stepNumber changes.
    */ 
    useEffect(() => {
        if (steps[stepNumber].tourName === TourName.PIVOT && steps[stepNumber].stepNumber === 1) {
            props.setHighlightPivotTableButton(true)
        } else {
            props.setHighlightPivotTableButton(false)
            props.setHighlightAddColButton(false)
        }
    }, [stepNumber])

    // Go to stepNumber if it exists, otherwise close the tour
    const goToStep = (newStepNumber: number) => {
        if (newStepNumber <= steps.length - 1) {
            // Log switching steps
            void props.mitoAPI.log(
                'switched_tour_step',
                {
                    'old_tour_name': steps[stepNumber].tourName,
                    'old_tour_step': stepNumber,
                    'new_tour_name': steps[newStepNumber].tourName,
                    'new_tour_step': newStepNumber,
                    'tour_names': props.tourNames,
                    'total_number_of_tour_steps': steps.length
                }
            )

            // Update the step number
            setStepNumber(newStepNumber)
        } else {
            void closeTour();
        }
    }

    // Called if you close the tour on the final step
    const closeTour = async (_skippedTour?: boolean): Promise<void> => {
        // Log finishing the tour, if you didn't skip to the final step
        if (!skippedTour && !_skippedTour) {
            void props.mitoAPI.log(
                'finished_tour', 
                {
                    'tour_names': props.tourNames,
                    'total_number_of_tour_steps': steps.length
                }
            )
        }
        
        // Make sure that the pivot & Add Col button is not stuck in pulsing mode. 
        props.setHighlightPivotTableButton(false)
        props.setHighlightAddColButton(false)

        // Send the closeTour message to the backend. We still record each tour individually
        // so we can later add new tours to display to users
        await props.mitoAPI.updateCloseTour(props.tourNames);
    }

    /* 
        Retrieve the finalStepText, which is the text displayed in the body of the tour popup.
        Although not enforced by the type system, a tour step should either have a defined stepText of stepTextFunction.
    */ 
    const stepText = steps[stepNumber].stepText;
    const stepTextFunction = steps[stepNumber].stepTextFunction;
    const finalStepText = stepText || (stepTextFunction && stepTextFunction(props.sheetData?.data[0].columnID || ''));

    // If we're at a valid step number
    return (
        <div className={classNames('tour-container', locationToClassNamesMapping[steps[stepNumber].location])} key={stepNumber}>
            <Row>
                <Col>
                    <p className='text-header-2 text-color-background-important'>
                        {steps[stepNumber].stepHeader} ({stepNumber + 1}/{steps.length})
                    </p>
                </Col>
            </Row>
            <div className='text-overflow-wrap mb-20px text-body-1 text-color-background-important'>
                {finalStepText}
            </div>
            <Row justify='space-between'>
                {stepNumber - 1 >= 0 &&
                    <Col>
                        <TextButton
                            variant='light'
                            width='small'
                            onClick={() => goToStep(stepNumber - 1)}
                        >
                            Back
                        </TextButton>
                    </Col>
                }
                {stepNumber - 1 <= 0 &&
                    // Add a space so that the advance button is always in the same place
                    <Col></Col>
                }
                <Col>
                    <TextButton
                        variant='light'
                        width='small'
                        onClick={() => goToStep(stepNumber + 1)}
                    >
                        {steps[stepNumber].advanceButtonText}
                    </TextButton>
                </Col>
            </Row>
        </div>
    )
}

export default Tour
