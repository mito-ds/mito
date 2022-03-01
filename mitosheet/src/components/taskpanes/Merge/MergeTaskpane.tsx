// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../api';
import { ColumnID, ColumnIDsMap, SheetData, UIState } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import Select from '../../elements/Select';
import XIcon from '../../icons/XIcon';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import { getDtypeValue } from '../ControlPanel/FilterAndSortTab/DtypeCard';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { TaskpaneType } from '../taskpanes';
import MergeSheetAndKeySelection from './MergeSheetAndKeySelection';
import { getSuggestedKeysColumnID } from './mergeUtils';


// Enum to allow you to refer to the first or second sheet by name, for clarity
export enum MergeSheet {
    First = 0,
    Second = 1
}

/*
    Each entry of this enum is a merge type that the user can choose. 
    In all cases, except lookup, these values are passed directly to 
    the pandas merge function. 
*/
export enum MergeType {
    LOOKUP = 'lookup',
    LEFT = 'left',
    RIGHT = 'right',
    INNER = 'inner',
    OUTER = 'outer',
    UNIQUE_IN_LEFT = 'unique in left',
    UNIQUE_IN_RIGHT = 'unique in right'
}


export type MergeTaskpaneProps = {
    dfNames: string[],
    columnIDsMapArray: ColumnIDsMap[],
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI
};

type MergeTaskpaneState = {
    mergeType: MergeType,
    sheetOneIndex: number,
    sheetTwoIndex: number,
    mergeKeyColumnIDOne: ColumnID,
    mergeKeyColumnIDTwo: ColumnID,
    selectedColumnIDsOne: ColumnID[],
    selectedColumnIDsTwo: ColumnID[],
    originalDfNames: string[],
    stepID: string, 
    errorMessage: string | undefined
};

class MergeTaskpane extends React.Component<MergeTaskpaneProps, MergeTaskpaneState> {

    constructor(props: MergeTaskpaneProps) {
        super(props);

        // We default the merge modal to select the selected sheet index as the first sheet
        const sheetOneIndex = props.selectedSheetIndex;
        // The second sheet is either: the sheet to the right, if it exists,
        // or the one to the left, it exists. If neither exist, then it is just
        // the same as sheet one index, as there is only one sheet
        const sheetTwoIndex = sheetOneIndex + 1 <= props.sheetDataArray.length - 1
            ? sheetOneIndex + 1
            : (sheetOneIndex - 1 >= 0 ? sheetOneIndex - 1 : sheetOneIndex)

        if (props.sheetDataArray.length < 2) {
            // If there is no data, we just set default values
            this.state = {
                mergeType: MergeType.LOOKUP,
                sheetOneIndex: sheetOneIndex,
                sheetTwoIndex: sheetTwoIndex,
                mergeKeyColumnIDOne: '',
                mergeKeyColumnIDTwo: '',
                selectedColumnIDsOne: [],
                selectedColumnIDsTwo: [],
                originalDfNames: props.dfNames,
                stepID: '',
                errorMessage: undefined
            };
        } else {
            const suggestedKeys = getSuggestedKeysColumnID(this.props.columnIDsMapArray, sheetOneIndex, sheetTwoIndex);

            // We default to selecting _all_ columns
            const selectedColumnIDsOne = [...Object.keys(this.props.columnIDsMapArray[sheetOneIndex])]
            const selectedColumnIDsTwo = [...Object.keys(this.props.columnIDsMapArray[sheetTwoIndex])]
        
            this.state = {
                mergeType: MergeType.LOOKUP,
                sheetOneIndex: sheetOneIndex,
                sheetTwoIndex: sheetTwoIndex,
                mergeKeyColumnIDOne: suggestedKeys.mergeKeyColumnIDOne,
                mergeKeyColumnIDTwo: suggestedKeys.mergeKeyColumnIDTwo,
                selectedColumnIDsOne: selectedColumnIDsOne,
                selectedColumnIDsTwo: selectedColumnIDsTwo,
                originalDfNames: props.dfNames,
                stepID: '',
                errorMessage: undefined
            };
        }

        this.setNewSheetIndex = this.setNewSheetIndex.bind(this);
        this.setNewMergeKeyColumnID = this.setNewMergeKeyColumnID.bind(this);
        this.toggleKeepColumnIDs = this.toggleKeepColumnIDs.bind(this);
        this.sendMergeMessage = this.sendMergeMessage.bind(this);
        this.setNewMergeType = this.setNewMergeType.bind(this);
    }
    
    /*
        It is best practice to make async calls not in the constructor, 
        but rather in the componentDidMount lifecycle method!
    */
    componentDidMount(): void {
        // Send the first merge message there are at least 2 sheets in Mito.
        if (this.props.sheetDataArray.length >= 2) {
            void this.sendMergeMessage();
        }
    }

    /*
        Helper function for updating the merge type in state and 
        sending the merge message to the backend. 
    */
    setNewMergeType(newMergeType: MergeType): void {
        this.setState({mergeType: newMergeType}, () => {
            void this.sendMergeMessage();
        });
    }

    /*
        When one of the two merge indexes is changed, we change state by:
        1. Updating the sheet index.
        2. Updating the columns that are selected (this defaults to all), as well as the toggle 
           for this sheet.
        3. Trying to find a new merge key between the sheets
    */
    setNewSheetIndex(sheetNumber: MergeSheet, newSheetIndex: number): void {
        const indexName = sheetNumber == MergeSheet.First ? 'sheetOneIndex' : 'sheetTwoIndex'
        const selectedColumnsName = sheetNumber == MergeSheet.First ? 'selectedColumnIDsOne' : 'selectedColumnIDsTwo';
        const toggleAllName = sheetNumber == MergeSheet.First ? 'sheetOneToggleAll' : 'sheetTwoToggleAll';

        const newSelectedColumnIDs = this.props.sheetDataArray[newSheetIndex].data.map(c => c.columnID);

        this.setState(prevState => {
            // Return if we're not changing anything!
            if (prevState[indexName] == newSheetIndex) {
                return;
            }
            
            const newSuggestedKeys = getSuggestedKeysColumnID(
                this.props.columnIDsMapArray, 
                sheetNumber === MergeSheet.First ? newSheetIndex : prevState.sheetOneIndex, 
                sheetNumber === MergeSheet.Second ? newSheetIndex : prevState.sheetTwoIndex
            );

            return {
                ...prevState,
                [indexName]: newSheetIndex,
                [selectedColumnsName]: newSelectedColumnIDs,
                [toggleAllName]: true,
                mergeKeyColumnIDOne: newSuggestedKeys.mergeKeyColumnIDOne,
                mergeKeyColumnIDTwo: newSuggestedKeys.mergeKeyColumnIDTwo
            }
        }, () => {
            void this.sendMergeMessage();
        });
    }

    /*
        Sets a new merge key for one of the merge sheets
    */
    setNewMergeKeyColumnID(sheetNumber: MergeSheet, newMergeKeyColumnID: ColumnID): void {
        const mergeKeyIDName = sheetNumber === MergeSheet.First ? 'mergeKeyColumnIDOne' : 'mergeKeyColumnIDTwo';

        this.setState(prevState => {
            return {
                ...prevState,
                [mergeKeyIDName]: newMergeKeyColumnID,
            }
        }, () => {
            void this.sendMergeMessage();
        });
    }

    /*
        Toggles if we should keep a specific column from one of the sheets in the new
        merged sheet.
    */
    toggleKeepColumnIDs(sheetNumber: MergeSheet, columnIDs: ColumnID[], newToggle: boolean): void {
        const selectedColumnIDsName = sheetNumber == MergeSheet.First ? 'selectedColumnIDsOne' : 'selectedColumnIDsTwo'
        const mergeKeyIDName = sheetNumber == MergeSheet.First ? 'mergeKeyColumnIDOne' : 'mergeKeyColumnIDTwo'

        this.setState(prevState => {
            const newSelectedColumnIDs = [...prevState[selectedColumnIDsName]]

            for (let i = 0; i < columnIDs.length; i++) {
                const columnID = columnIDs[i];

                // We the don't let you toggle the merge key!
                if (prevState[mergeKeyIDName] === columnID) {
                    return;
                }

                if (newToggle) {
                    if (!newSelectedColumnIDs.includes(columnID)) {
                        newSelectedColumnIDs.push(columnID)
                    }
                } else {
                    if (newSelectedColumnIDs.includes(columnID)) {
                        newSelectedColumnIDs.splice(newSelectedColumnIDs.indexOf(columnID), 1)
                    }
                }
            }
            

            return {
                ...prevState,
                [selectedColumnIDsName]: newSelectedColumnIDs
            }
        }, () => {
            void this.sendMergeMessage();
        });
    }

    /*
        Completes the merge operation by sending information for the merge
        to the backend, potentially overwriting what's already there!
    */
    async sendMergeMessage(): Promise<void> {

        // NOTE: We make sure to send the merge keys in the selected columns, no matter what
        const selectedColumnIDsOne = [...this.state.selectedColumnIDsOne];
        if (!selectedColumnIDsOne.includes(this.state.mergeKeyColumnIDOne)) {
            selectedColumnIDsOne.push(this.state.mergeKeyColumnIDOne)
        }
        const selectedColumnIDsTwo = [...this.state.selectedColumnIDsTwo];
        if (!selectedColumnIDsTwo.includes(this.state.mergeKeyColumnIDTwo)) {
            selectedColumnIDsTwo.push(this.state.mergeKeyColumnIDTwo)
        }

        const stepIDOrError = await this.props.mitoAPI.editMerge(
            this.state.mergeType,
            this.state.sheetOneIndex,
            this.state.mergeKeyColumnIDOne,
            selectedColumnIDsOne,
            this.state.sheetTwoIndex,
            this.state.mergeKeyColumnIDTwo,
            selectedColumnIDsTwo,
            this.state.stepID
        )

        if (typeof stepIDOrError === 'string') {
            // Save the merge ID, clearing the error
            this.setState({
                errorMessage: undefined,
                stepID: stepIDOrError
            })
        } else {
            // Save the error message
            this.setState({
                errorMessage: stepIDOrError.to_fix
            })
        }
    }

    render(): JSX.Element  {
        /*
            If there are less than 2 sheets in Mito to merge together, 
            then display this error message.
        */
        if (this.props.sheetDataArray.length < 2) {
            return <DefaultEmptyTaskpane setUIState={this.props.setUIState} message='You need two dataframes before you can merge them.'/>
        }

        /*
            We don't let you select or unselect the sheet merge key, and note that we must account
            for the shift in the indexes that this causes when updating if the state of an item is 
            toggled.

            Thus, we filter out the merge keys from both the list of columns, as well as the 
            toggles for these columns.

            Furthermore, we keep the dtypes with these column ids, so that we can display them
            as right text so the user gets more information about the columns that they are 
            taking.
        */

        const sheetOneOriginalColumnIDsAndDtypes: [ColumnID, string][] = this.props.sheetDataArray[this.state.sheetOneIndex] ? this.props.sheetDataArray[this.state.sheetOneIndex].data.map(c => [c.columnID, c.columnDtype]) : [];
        const sheetTwoOriginalColumnIDsAndDtypes: [ColumnID, string][] = this.props.sheetDataArray[this.state.sheetTwoIndex] ? this.props.sheetDataArray[this.state.sheetTwoIndex].data.map(c => [c.columnID, c.columnDtype]) : [];

        const sheetOneColumnIDsAndDtypesListWithoutMergeKey = sheetOneOriginalColumnIDsAndDtypes.filter(([columnID, ]) => columnID !== this.state.mergeKeyColumnIDOne)
        const sheetTwoColumnIDsAndDtypesListWithoutMergeKey = sheetTwoOriginalColumnIDsAndDtypes.filter(([columnID, ]) => columnID !== this.state.mergeKeyColumnIDTwo)

        const sheetOneToggles = sheetOneColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, ]) => this.state.selectedColumnIDsOne.includes(columnID))
        const sheetTwoToggles = sheetTwoColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, ]) => this.state.selectedColumnIDsTwo.includes(columnID))

        const sheetOneColumnIDsMap = this.props.columnIDsMapArray[this.state.sheetOneIndex];
        const sheetTwoColumnIDsMap = this.props.columnIDsMapArray[this.state.sheetTwoIndex];

        // Display an error in the header, if there is an error
        const header = (
            <div className='flexbox-row flexbox-space-between element-width-block'>
                {this.state.errorMessage === undefined && 
                    <p className='text-header-2'>
                        Merge Sheets Together
                    </p>
                }
                {this.state.errorMessage !== undefined && 
                    <p className='text-color-error' style={{width: '85%'}}>
                        {this.state.errorMessage}
                    </p>
                }
                <XIcon onClick={() => this.props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.NONE} 
                    }
                })}/>
            </div>
        )

        return (
            <DefaultTaskpane>
                <DefaultTaskpaneHeader
                    header={header}
                    headerOutsideRow
                    setUIState={this.props.setUIState}
                />
                <DefaultTaskpaneBody>
                    <Row justify='space-between' align='center' suppressTopBottomMargin>
                        <Col offsetRight={1}>
                            <p className='text-header-3'>
                                Merge Type
                            </p>
                        </Col>
                        <Col>
                            <Select 
                                value={this.state.mergeType}
                                onChange={(mergeType: string) => {
                                    const newMergeTypeEnum = mergeType as MergeType
                                    this.setNewMergeType(newMergeTypeEnum)
                                }}
                                width='medium'
                            >
                                <DropdownItem
                                    title={MergeType.LOOKUP}
                                    subtext="Includes all rows from the first sheet and only matching rows from the second sheet. If there are mulitple matches in the second sheet, only takes the first."
                                />
                                <DropdownItem
                                    title={MergeType.LEFT}
                                    subtext="Includes all rows from the first sheet and only matching rows from the second sheet. Includes all matches."
                                />
                                <DropdownItem
                                    title={MergeType.RIGHT}
                                    subtext="Includes all rows from the second sheet and only matching rows from the  first sheet. Includes all matches."
                                />
                                <DropdownItem
                                    title={MergeType.INNER}
                                    subtext="Only includes rows that have matches in both sheets."
                                />
                                <DropdownItem
                                    title={MergeType.OUTER}
                                    subtext="Includes all rows from both sheets, regardless of whether there is a match in the other sheet."
                                />
                                <DropdownItem
                                    title={MergeType.UNIQUE_IN_LEFT}
                                    subtext="Includes each row from the first sheet that doesn't have a match in the second sheet."
                                />
                                <DropdownItem
                                    title={MergeType.UNIQUE_IN_RIGHT}
                                    subtext="Includes each row from second sheet that doesn't have a match in the first sheet."
                                />
                            </Select>
                        </Col>
                    </Row>
                    <MergeSheetAndKeySelection
                        dfNames={this.state.originalDfNames}
                        columnIDsMap={sheetOneColumnIDsMap}
                        
                        sheetNum={MergeSheet.First}
                        sheetIndex={this.state.sheetOneIndex}
                        mergeKeyColumnID={this.state.mergeKeyColumnIDOne}
                        otherSheetIndex={this.state.sheetTwoIndex}
                        
                        setNewSheetIndex={(newSheetIndex) => {this.setNewSheetIndex(MergeSheet.First, newSheetIndex)}}
                        setNewMergeKeyColumnID={(newMergeKeyColumnID) => this.setNewMergeKeyColumnID(MergeSheet.First, newMergeKeyColumnID)}
                    />
                    <p className='text-header-3'>
                        Columns to Keep
                    </p>
                    {this.state.mergeType !== MergeType.UNIQUE_IN_RIGHT &&
                        <MultiToggleBox
                            searchable
                            toggleAllIndexes={(indexesToToggle, newToggle) => {
                                const columnIDs = indexesToToggle.map(index => sheetOneColumnIDsAndDtypesListWithoutMergeKey[index][0]);
                                this.toggleKeepColumnIDs(MergeSheet.First, columnIDs, newToggle);
                            }}
                            height='medium'
                        >
                            {sheetOneColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, columnDtype], index) => {
                                const columnHeader = sheetOneColumnIDsMap[columnID];
                                return (
                                    <MultiToggleItem
                                        key={index}
                                        title={getDisplayColumnHeader(columnHeader)}
                                        rightText={getDtypeValue(columnDtype)}
                                        toggled={sheetOneToggles[index]}
                                        index={index}
                                        onToggle={() => {
                                            this.toggleKeepColumnIDs(MergeSheet.First, [columnID], !sheetOneToggles[index])
                                        }}
                                    />
                                ) 
                            })}
                        </MultiToggleBox>
                    }
                    {this.state.mergeType === MergeType.UNIQUE_IN_RIGHT &&
                        <p>
                            Finding the unique values in the second sheet doesn&apos;t keep any columns from the first sheet.
                        </p>
                    }
                    <MergeSheetAndKeySelection
                        dfNames={this.state.originalDfNames}
                        columnIDsMap={sheetTwoColumnIDsMap}
                        
                        sheetNum={MergeSheet.Second}
                        mergeKeyColumnID={this.state.mergeKeyColumnIDTwo}
                        sheetIndex={this.state.sheetTwoIndex}
                        otherSheetIndex={this.state.sheetOneIndex}

                        setNewSheetIndex={(newSheetIndex) => {this.setNewSheetIndex(MergeSheet.Second, newSheetIndex)}}
                        setNewMergeKeyColumnID={(newMergeKeyColumnID) => this.setNewMergeKeyColumnID(MergeSheet.Second, newMergeKeyColumnID)}
                    />
                    <div>
                        <p className='text-header-3'>
                            Columns to Keep
                        </p>
                        {this.state.mergeType !== MergeType.UNIQUE_IN_LEFT && 
                            <MultiToggleBox
                                searchable
                                toggleAllIndexes={(indexesToToggle, newToggle) => {
                                    const columnIDs = indexesToToggle.map(index => sheetTwoColumnIDsAndDtypesListWithoutMergeKey[index][0]);
                                    this.toggleKeepColumnIDs(MergeSheet.Second, columnIDs, newToggle);
                                }}
                                height='medium'
                            >
                                {sheetTwoColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, columnDtype], index) => {
                                    const columnHeader = sheetTwoColumnIDsMap[columnID];
                                    return (
                                        <MultiToggleItem
                                            key={index}
                                            title={getDisplayColumnHeader(columnHeader)}
                                            rightText={getDtypeValue(columnDtype)}
                                            toggled={sheetTwoToggles[index]}
                                            index={index}
                                            onToggle={() => {
                                                this.toggleKeepColumnIDs(MergeSheet.Second, [columnID], !sheetTwoToggles[index])
                                            }}
                                        />
                                    ) 
                                })}
                            </MultiToggleBox>
                        }
                        {this.state.mergeType === MergeType.UNIQUE_IN_LEFT &&
                            <p>
                                Finding the unique values in the first sheet doesn&apos;t keep any columns from the second sheet.
                            </p>
                        }
                    </div>
                </DefaultTaskpaneBody>
            </DefaultTaskpane>
        )
    }
}

export default MergeTaskpane;