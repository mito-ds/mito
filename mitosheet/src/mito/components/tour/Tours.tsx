/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { DOCUMENTATION_LINK_SPREADSHEET_FORMULAS, DOCUMENTATION_LINK_TUTORIAL } from '../../data/documentationLinks';

/* 
    To create a new tour:
        1. Add the TourName to the TourName enum.
        2. Create a list of steps using the naming: {TourName}TourSteps. aka PivotTourSteps
        3. Add the new Tour to the tours object at the bottom of this file
        4. Add the tour to the displayTour function in Mito.tsx
*/

// Tours is a mapping from tourName to its list of TourSteps
type Tours = {
    [tour in TourName]: TourStep[];
};

/* 
    The name used to identify the tour in the tours mapping. 
    The string declared here is written to the user.json file to register
    that the tour has already been taken.

    Note: changing the strings will cause the user to receive the tour again!
*/
export enum TourName {
    INTRO = 'Intro',
    PIVOT = 'Pivot',
    TUTORIAL = 'Tutorial',
    COLUMN_FORMULAS = 'Column_Formulas',
    EXPLORE_DATA = 'Explore_Datasets',
}

export type TourStep = {
    tourName: TourName,
    stepNumber: number, // we keep track of the step number within each tour for logging
    stepHeader: string,
    stepHeaderBackgroundColor: string,
    stepText?: JSX.Element, // Each tour step must either have a stepText or stepTextFunction
    stepTextFunction?: ((replacementText1: string) => JSX.Element)
    location: TourPopupLocation,
    advanceButtonText: string,
    displayBackButton: boolean,
}

// Location to display the TourStep popup
export enum TourPopupLocation {
    BOTTOM_LEFT = 'bottom_left',
    BOTTOM_RIGHT = 'bottom_right',
    TOP_LEFT = 'top_left',
    TOP_RIGHT = 'top_right'
}

const introTourSteps: TourStep[] = [
    {
        tourName: TourName.INTRO,
        stepNumber: 1,
        stepHeader: 'Seeing your data',
        stepHeaderBackgroundColor: '#BCDFBC',
        stepText: <div> Your data is visible in the sheet. Each dataframe is represented by a different tab. </div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: false,
    },
    {
        tourName: TourName.INTRO,
        stepNumber: 2,
        stepHeader: 'Find functionality',
        stepHeaderBackgroundColor: '#DDA1A1',
        stepText: <div> All functionality can be found through the toolbar. Explore the toolbar to see what is possible. </div>,
        location: TourPopupLocation.TOP_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true,
    },
    {
        tourName: TourName.INTRO,
        stepNumber: 3,
        stepHeader: 'Use the generated code',
        stepHeaderBackgroundColor: '#79C2F8',
        stepText: <div>Each time you make an edit, Mito generates equivalent Python code in the cell below. Running this generated code edits the dataframes in your notebook directly.</div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
]

const pivotTourSteps: TourStep[] = [
    {
        tourName: TourName.PIVOT,
        stepNumber: 1,
        stepHeader: 'Creating a pivot table',
        stepHeaderBackgroundColor: '#BCDFBC',
        stepText: <div> <b> Click on the Pivot button</b> to get started. Mito’s pivot tables make it easy to slice and dice your data into different categories. </div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true,
    },
    {
        tourName: TourName.PIVOT,
        stepNumber: 2,
        stepHeader: 'Configure your pivot table',
        stepHeaderBackgroundColor: '#DDA1A1',
        stepText: <div> In the open sidebar, <b>select a row and value </b> to create your pivot table.</div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
    {
        tourName: TourName.PIVOT,
        stepNumber: 3,
        stepHeader: 'That was easy!',
        stepHeaderBackgroundColor: '#79C2F8',
        stepText: <div><b>Checkout the pivot table code below</b>. Each time you create a pivot table, a new dataframe is created in both the Mito sheet and the generated code. We just saved our first few trips to stack overflow :&#x29; </div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
]

const ColumnFormulasTourSteps: TourStep[] = [
    {  
        tourName: TourName.COLUMN_FORMULAS,
        stepNumber: 1,
        stepHeader: 'Our Formulas are Different',
        stepHeaderBackgroundColor: '#BCDFBC',
        stepText: <div> Edit a column by updating its formula. If you want to uppercase the column <b>Name</b>, set its formula to <b>UPPER(Name)</b>. No extra columns necessary. </div>,
        location: TourPopupLocation.BOTTOM_RIGHT,
        advanceButtonText: "Continue",
        displayBackButton: true,
    },
    {
        tourName: TourName.COLUMN_FORMULAS,
        stepNumber: 2,
        stepHeader: 'Manually Reapply Formulas',
        stepHeaderBackgroundColor: '#DDA1A1',
        stepText: <div> Mito differs from other spreadsheets because formulas do not automatically update when the input data changes. If you want to update a specific formula, simply resubmit it!  </div>,
        location: TourPopupLocation.BOTTOM_RIGHT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
    {
        tourName: TourName.COLUMN_FORMULAS,
        stepNumber: 3,
        stepHeader: 'Become a Formula Expert',
        stepHeaderBackgroundColor: '#DDA1A1',
        stepText: <div> Want to learn more about how Mito&apos;s formulas are different? <a className='text-body-1-link text-color-background-important' href={DOCUMENTATION_LINK_SPREADSHEET_FORMULAS} target="_blank" rel="noreferrer">Check out our detailed formula documentation.</a></div>,
        location: TourPopupLocation.BOTTOM_RIGHT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
]

const ExploreDataTourSteps: TourStep[] = [
    {  
        tourName: TourName.EXPLORE_DATA,
        stepNumber: 1,
        stepHeader: 'Exploring data with Mito',
        stepHeaderBackgroundColor: '#BCDFBC',
        stepText: <div> Mito makes it easy to build intuition for your data by automatically generating summary information about each column. To get started, <b>click on the filter button in the column header</b> of one of your columns.</div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true,
    },
    {
        tourName: TourName.EXPLORE_DATA,
        stepNumber: 2,
        stepHeader: 'View summary stats',
        stepHeaderBackgroundColor: '#CAD1FF',
        stepText: <div> <b>Click on the Stats tab </b> at the bottom of the taskpane. The chart at the top shows you the distribution of your column, and there’s more specific summary information down below. Check it out!</div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
    {
        tourName: TourName.EXPLORE_DATA,
        stepNumber: 3,
        stepHeader: 'Add a filter',
        stepHeaderBackgroundColor: '#FFDAAE',
        stepText: <div><b>Switch over to the Filter/Sort Tab </b> to clean up your data now that you&apos;ve built up some intuition.  </div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
    {
        tourName: TourName.EXPLORE_DATA,
        stepNumber: 4,
        stepHeader: "Create a filter",
        stepHeaderBackgroundColor: '#79C2F8',
        stepText: <div><b>Click on the Add Filter button </b>, and then set the filter <b>condition and value</b>. </div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
    {
        tourName: TourName.EXPLORE_DATA,
        stepNumber: 5,
        stepHeader: "Enjoy your cleaned data",
        stepHeaderBackgroundColor: '#FFCBDE',
        stepText: <div>Nice work! In just a few clicks, we’ve built some intuition for our data and removed the values we&apos;re not interested in. </div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Continue",
        displayBackButton: true
    },
] 

const tutorialTourSteps: TourStep[] = [
    {
        tourName: TourName.TUTORIAL,
        stepNumber: 1,
        stepHeader: 'Before you go!',
        stepHeaderBackgroundColor: '#FFDAAE',
        stepText: <div>If you want more information on how to clean and analyze your data by writing spreadsheet formulas, visualizing your data, and adding filters, checkout our more detailed tutorial <a href={DOCUMENTATION_LINK_TUTORIAL} target="_blank" rel="noreferrer" style={{color:'#0081DE'}}>here</a>.</div>,
        location: TourPopupLocation.BOTTOM_LEFT,
        advanceButtonText: "Close",
        displayBackButton: true
    }
]

export const tours: Tours = {
    'Intro': introTourSteps,
    'Pivot': pivotTourSteps,
    'Tutorial': tutorialTourSteps,
    'Column_Formulas': ColumnFormulasTourSteps,
    'Explore_Datasets': ExploreDataTourSteps
}

