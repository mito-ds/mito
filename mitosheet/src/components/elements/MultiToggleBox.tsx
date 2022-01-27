// Copyright (c) Mito

import React, { useState } from 'react';

import '../../../css/elements/MultiToggleBox.css'
import { classNames } from '../../utils/classNames';
import { fuzzyMatch } from '../../utils/strings';
import Row from '../spacing/Row';
import Input from './Input';
import LoadingDots from './LoadingDots';
import { Height, Width } from './sizes.d';

/* 
    So that we don't crash the users browser, we show at most
    10k items to them at once
*/
const MAX_DISPLAYED = 10000;

/* 
  A box that contains a variety of options that can be toggled on and off indivigually.
  
  If optional toggleAllOptions are passed, then a Toggle All button is also displayed 
  that toggles all the buttons at once.
*/
const MultiToggleBox = (props: {
    /** 
        * @param className - Optional class name to add to the multi toggle box
    */
    className?: string
    /** 
        * @param children - These should be MultiToggleItems to display  
    */
    children: JSX.Element | JSX.Element[];
    /** 
        * @param [toggleAllIndexes] - If you want to toggle mulitple indexes at once, you can with this function
    */
    toggleAllIndexes?: (indexesToToggle: number[], newValue: boolean) => void;
    /** 
        * @param [height] - Height of the MultiToggleBox
    */
    height?: Height;
    /** 
        * @param [width] - Width of the MultiToggleBox
    */
    width?: Width;
    /** 
        * @param [searchable] - Add a search field to allow the user to only look at certain values. See searchParams as well.
    */
    searchable?: boolean;

    /**
     * @param [searchState] You can also pass a search string and a setSearch string if you want to maintain these values outside of of the MultiToggleBox itself, and the input will be diplayed here as well
     */
    searchState?: {
        searchString: string;
        setSearchString: React.Dispatch<React.SetStateAction<string>>;
    };

    /** 
        * @param [loading] - Display a loading message if the inputs are still coming
    */
    loading?: boolean;

    /** 
        * @param [isFiltered] - Display a message if not all data is being passed here,
        * for example if there is too much of it
    */
    isFiltered?: boolean;
}): JSX.Element => {    

    // We can store state in this element, or in the parent element if we want
    const [_searchString, _setSearchString] = useState('');
    const searchString = props.searchState !== undefined? props.searchState.searchString : _searchString;
    const setSearchString = props.searchState !== undefined? props.searchState.setSearchString : _setSearchString;

    const height = props.height || 'block'
    const width = props.width || 'block'
    const heightClass = `element-height-${height}`
    const widthClass = `element-width-${width}`

    let displayedAllToggled = true;
    const displayedIndexes: number[] = [];
    let numDisplayed = 0;
    let maxDisplayed = false;
    
    // Only display the options that we're searching for, and also collect
    // information about how many children are passed and displayed
    const childrenToDisplay = React.Children.map((props.children), (child) => {
        const title: null | undefined | string | number = child.props.title;

        // Don't display if it doesn't match
        if (title === null || title === undefined || fuzzyMatch(title + '', searchString) < .8) {
            return null;
        }

        // Don't display if we've displayed enough already
        if (numDisplayed > MAX_DISPLAYED) {
            maxDisplayed = true;
            return null;
        }

        numDisplayed++;

        displayedAllToggled = displayedAllToggled && child.props.toggled; 
        displayedIndexes.push(child.props.index);

        return child;
    })

    const { toggleAllIndexes } = props;

    return (
        <div className={classNames('mutli-toggle-box-container', heightClass, widthClass, props.className)}>
            {props.searchable &&
                <Input
                    value={searchString}
                    onChange={(e) => {
                        setSearchString(e.target.value)
                    }}
                    placeholder={'Search'}
                    width='block'
                    className='mb-2px'
                />
            }
            <div 
                className={classNames('multi-toggle-box')} 
                // It's hard to get the box to fill the rest of the container,
                // so we do a calculation if the search box is displayed
                style={{height: props.searchable ? 'calc(100% - 30px)' : '100%'}}
            >
                {props.loading === true &&
                    <Row justify='center'>
                        <p className='text-body-1 text-align-center'> 
                            Loading items<LoadingDots/>
                        </p>
                    </Row>
                }
                {!props.loading && (maxDisplayed || props.isFiltered) &&
                    <Row justify='center'>
                        <p className='text-body-1 text-align-center'> 
                            There are too many items to display. Search to filter down to the items you care about.
                        </p>
                    </Row>
                }
                {!props.loading && numDisplayed === 0 && 
                    <Row justify='center'>
                        <p className='text-body-1'> 
                            No items to display.
                        </p>
                    </Row>
                
                }
                {toggleAllIndexes !== undefined && numDisplayed > 0 &&
                    <div 
                        key='Toggle All' 
                        className={classNames('multi-toggle-box-row', {'multi-toggle-box-row-selected': displayedAllToggled})}
                        onClick={() => {
                            toggleAllIndexes(displayedIndexes, !displayedAllToggled)
                        }}
                    >
                        <input
                            key={'Toggle All'}
                            type="checkbox"
                            name={'Toggle All'}
                            checked={displayedAllToggled}
                        />
                        Toggle All {searchString !== '' && " Matching"}
                    </div>
                }
                {childrenToDisplay}
            </div>
        </div>
    )
}

export default MultiToggleBox;
