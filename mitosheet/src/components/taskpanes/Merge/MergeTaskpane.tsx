// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import { ColumnID, DataframeID, SheetData, UIState } from '../../../types';
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
    selectedDataframeID: DataframeID,
    sheetDataMap: Record<DataframeID, SheetData>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI
};

type MergeParams = {
    mergeType: MergeType,
    dataframeIDOne: DataframeID | undefined,
    dataframeIDTwo: DataframeID | undefined,
    mergeKeyColumnIDOne: ColumnID | undefined,
    mergeKeyColumnIDTwo: ColumnID | undefined,
    selectedColumnIDsOne: ColumnID[],
    selectedColumnIDsTwo: ColumnID[],
};


const MergeTaskpane = (props: MergeTaskpaneProps): JSX.Element => {

    const [mergeParams, setMergeParams] = useState<MergeParams>(() => {

        const allDataframeIDs = Object.keys(props.sheetDataMap);

        const dataframeIDOne = props.selectedDataframeID;
        const dataframeIndexOne = allDataframeIDs.indexOf(dataframeIDOne);
        const dataframeIDTwo: DataframeID | undefined = allDataframeIDs[dataframeIndexOne + 1] || allDataframeIDs[dataframeIndexOne - 1]

        const suggestedKeys = getSuggestedKeysColumnID(
            props.sheetDataMap, 
            dataframeIDOne, 
            dataframeIDTwo
        );

        const selectedColumnIDsOne = [...Object.keys(props.sheetDataMap[dataframeIDOne]?.columnIDsMap || {})]
        const selectedColumnIDsTwo = [...Object.keys(props.sheetDataMap[dataframeIDTwo]?.columnIDsMap || {})]

        return {
            mergeType: MergeType.LOOKUP,
            dataframeIDOne: dataframeIDOne,
            dataframeIDTwo: dataframeIDTwo,
            mergeKeyColumnIDOne: suggestedKeys.mergeKeyColumnIDOne,
            mergeKeyColumnIDTwo: suggestedKeys.mergeKeyColumnIDTwo,
            selectedColumnIDsOne: selectedColumnIDsOne,
            selectedColumnIDsTwo: selectedColumnIDsTwo
        };
    })

    // We cache the original dataframe IDs so that we don't allow users
    // to select the merge sheet as an input to merge (this makes no sense)
    const [originalDataframeIDs] = useState(() => {return Object.keys(props.sheetDataMap)})

    const [stepID, setStepID] = useState<string | undefined>(undefined);
    const [errorMessage, setErrormessage] = useState<string | undefined>(undefined);


    useEffect(() => {
        // Send the first merge message there are at least 2 sheets in Mito.
        if (Object.keys(props.sheetDataMap).length >= 2) {
            void sendMergeMessage();
        }
    }, [mergeParams])


    /*
        If there are less than 2 sheets in Mito to merge together, 
        then display this error message.
    */
    if (Object.keys(props.sheetDataMap).length < 2 || mergeParams.dataframeIDOne === undefined || mergeParams.dataframeIDTwo === undefined || mergeParams.mergeKeyColumnIDOne === undefined || mergeParams.mergeKeyColumnIDTwo === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message='You need two dataframes before you can merge them.'/>
    }


    /*
        Helper function for updating the merge type in state and 
        sending the merge message to the backend. 
    */
    const setNewMergeType = (newMergeType: MergeType): void => {
        setMergeParams(oldMergeParams => {
            return {
                ...oldMergeParams,
                mergeType: newMergeType
            }
        })
    }
    
    /*
        When one of the two merge indexes is changed, we change state by:
        1. Updating the dataframeID.
        2. Updating the columns that are selected (this defaults to all), as well as the toggle 
            for this sheet.
        3. Trying to find a new merge key between the sheets
    */
    const setNewDataframeID = (sheetNumber: MergeSheet, newDataframeID: DataframeID): void => {
        const indexName = sheetNumber == MergeSheet.First ? 'dataframeIDOne' : 'dataframeIDTwo'
        const selectedColumnsName = sheetNumber == MergeSheet.First ? 'selectedColumnIDsOne' : 'selectedColumnIDsTwo';
        const toggleAllName = sheetNumber == MergeSheet.First ? 'sheetOneToggleAll' : 'sheetTwoToggleAll';

        const newSelectedColumnIDs = props.sheetDataMap[newDataframeID].data.map(c => c.columnID);

        setMergeParams(prevMergeParams => {
            if (prevMergeParams[indexName] === newDataframeID) {
                return prevMergeParams;
            }

            const newSuggestedKeys = getSuggestedKeysColumnID(
                props.sheetDataMap, 
                sheetNumber === MergeSheet.First ? newDataframeID : (prevMergeParams.dataframeIDOne || newDataframeID), 
                sheetNumber === MergeSheet.Second ? newDataframeID : (prevMergeParams.dataframeIDTwo || newDataframeID)
            );

            return {
                ...prevMergeParams,
                [indexName]: newDataframeID,
                [selectedColumnsName]: newSelectedColumnIDs,
                [toggleAllName]: true,
                mergeKeyColumnIDOne: newSuggestedKeys.mergeKeyColumnIDOne,
                mergeKeyColumnIDTwo: newSuggestedKeys.mergeKeyColumnIDTwo
            }
        })
    }
    
    /*
        Sets a new merge key for one of the merge sheets
    */
    const setNewMergeKeyColumnID = (sheetNumber: MergeSheet, newMergeKeyColumnID: ColumnID): void => {
        const mergeKeyIDName = sheetNumber === MergeSheet.First ? 'mergeKeyColumnIDOne' : 'mergeKeyColumnIDTwo';

        setMergeParams(prevMergeParams => {
            return {
                ...prevMergeParams,
                [mergeKeyIDName]: newMergeKeyColumnID,
            }
        })
    }
    
    /*
        Toggles if we should keep a specific column from one of the sheets in the new
        merged sheet.
    */
    const toggleKeepColumnIDs = (sheetNumber: MergeSheet, columnIDs: ColumnID[], newToggle: boolean): void => {
        const selectedColumnIDsName = sheetNumber == MergeSheet.First ? 'selectedColumnIDsOne' : 'selectedColumnIDsTwo'
        const mergeKeyIDName = sheetNumber == MergeSheet.First ? 'mergeKeyColumnIDOne' : 'mergeKeyColumnIDTwo'

        setMergeParams(prevMergeParams => {
            const newSelectedColumnIDs = [...prevMergeParams[selectedColumnIDsName]]

            for (let i = 0; i < columnIDs.length; i++) {
                const columnID = columnIDs[i];

                // We the don't let you toggle the merge key!
                if (prevMergeParams[mergeKeyIDName] === columnID) {
                    return prevMergeParams;
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
                ...prevMergeParams,
                [selectedColumnIDsName]: newSelectedColumnIDs
            }
        })
    }
    
    /*
        Completes the merge operation by sending information for the merge
        to the backend, potentially overwriting what's already there!
    */
    const sendMergeMessage = async (): Promise<void> => {

        if (mergeParams.dataframeIDOne === undefined || mergeParams.dataframeIDTwo === undefined || mergeParams.mergeKeyColumnIDOne === undefined || mergeParams.mergeKeyColumnIDTwo === undefined) {
            return;
        }

        // NOTE: We make sure to send the merge keys in the selected columns, no matter what
        const selectedColumnIDsOne = [...mergeParams.selectedColumnIDsOne];
        if (!selectedColumnIDsOne.includes(mergeParams.mergeKeyColumnIDOne)) {
            selectedColumnIDsOne.push(mergeParams.mergeKeyColumnIDOne)
        }
        const selectedColumnIDsTwo = [...mergeParams.selectedColumnIDsTwo];
        if (!selectedColumnIDsTwo.includes(mergeParams.mergeKeyColumnIDTwo)) {
            selectedColumnIDsTwo.push(mergeParams.mergeKeyColumnIDTwo)
        }

        const stepIDOrError = await props.mitoAPI.editMerge(
            mergeParams.mergeType,
            mergeParams.dataframeIDOne,
            mergeParams.mergeKeyColumnIDOne,
            selectedColumnIDsOne,
            mergeParams.dataframeIDTwo,
            mergeParams.mergeKeyColumnIDTwo,
            selectedColumnIDsTwo,
            stepID
        )

        if (typeof stepIDOrError === 'string') {
            // Save the merge ID, clearing the error
            setErrormessage(undefined);
            setStepID(stepIDOrError);
        } else {
            // Save the error message
            setErrormessage(stepIDOrError.to_fix);
        }
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

    const sheetOneOriginalColumnIDsAndDtypes: [ColumnID, string][] = props.sheetDataMap[mergeParams.dataframeIDOne] ? props.sheetDataMap[mergeParams.dataframeIDOne].data.map(c => [c.columnID, c.columnDtype]) : [];
    const sheetTwoOriginalColumnIDsAndDtypes: [ColumnID, string][] = props.sheetDataMap[mergeParams.dataframeIDTwo] ? props.sheetDataMap[mergeParams.dataframeIDTwo].data.map(c => [c.columnID, c.columnDtype]) : [];

    const sheetOneColumnIDsAndDtypesListWithoutMergeKey = sheetOneOriginalColumnIDsAndDtypes.filter(([columnID, ]) => columnID !== mergeParams.mergeKeyColumnIDOne)
    const sheetTwoColumnIDsAndDtypesListWithoutMergeKey = sheetTwoOriginalColumnIDsAndDtypes.filter(([columnID, ]) => columnID !== mergeParams.mergeKeyColumnIDTwo)

    const sheetOneToggles = sheetOneColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, ]) => mergeParams.selectedColumnIDsOne.includes(columnID))
    const sheetTwoToggles = sheetTwoColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, ]) => mergeParams.selectedColumnIDsTwo.includes(columnID))

    const sheetOneColumnIDsMap = props.sheetDataMap[mergeParams.dataframeIDOne].columnIDsMap;
    const sheetTwoColumnIDsMap = props.sheetDataMap[mergeParams.dataframeIDTwo].columnIDsMap;

    // Display an error in the header, if there is an error
    const header = (
        <div className='flexbox-row flexbox-space-between element-width-block'>
            {errorMessage === undefined && 
                <p className='text-header-2'>
                    Merge Sheets Together
                </p>
            }
            {errorMessage !== undefined && 
                <p className='text-color-error' style={{width: '85%'}}>
                    {errorMessage}
                </p>
            }
            <XIcon onClick={() => props.setUIState(prevUIState => {
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
                setUIState={props.setUIState}
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
                            value={mergeParams.mergeType}
                            onChange={(mergeType: string) => {
                                const newMergeTypeEnum = mergeType as MergeType
                                setNewMergeType(newMergeTypeEnum)
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
                    sheetDataMap={props.sheetDataMap}
                    originalDataframeIDs={originalDataframeIDs}
                    
                    sheetNum={MergeSheet.First}
                    dataframeID={mergeParams.dataframeIDOne}
                    otherDataframeID={mergeParams.dataframeIDTwo}
                    mergeKeyColumnID={mergeParams.mergeKeyColumnIDOne}
                    
                    setNewDataframeID={(newDataframeID) => {setNewDataframeID(MergeSheet.First, newDataframeID)}}
                    setNewMergeKeyColumnID={(newMergeKeyColumnID) => setNewMergeKeyColumnID(MergeSheet.First, newMergeKeyColumnID)}
                />
                <p className='text-header-3'>
                    Columns to Keep
                </p>
                {mergeParams.mergeType !== MergeType.UNIQUE_IN_RIGHT &&
                    <MultiToggleBox
                        searchable
                        toggleAllIndexes={(indexesToToggle, newToggle) => {
                            const columnIDs = indexesToToggle.map(index => sheetOneColumnIDsAndDtypesListWithoutMergeKey[index][0]);
                            toggleKeepColumnIDs(MergeSheet.First, columnIDs, newToggle);
                        }}
                        height='medium'
                    >
                        {sheetOneColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, columnDtype], index) => {
                            const columnHeader = sheetOneColumnIDsMap[columnID];
                            return (
                                <MultiToggleItem
                                    key={index}
                                    index={index}
                                    title={getDisplayColumnHeader(columnHeader)}
                                    rightText={getDtypeValue(columnDtype)}
                                    toggled={sheetOneToggles[index]}
                                    onToggle={() => {
                                        toggleKeepColumnIDs(MergeSheet.First, [columnID], !sheetOneToggles[index])
                                    }}
                                />
                            ) 
                        })}
                    </MultiToggleBox>
                }
                {mergeParams.mergeType === MergeType.UNIQUE_IN_RIGHT &&
                    <p>
                        Finding the unique values in the second sheet doesn&apos;t keep any columns from the first sheet.
                    </p>
                }
                <MergeSheetAndKeySelection
                    sheetDataMap={props.sheetDataMap}
                    originalDataframeIDs={originalDataframeIDs}
                    
                    sheetNum={MergeSheet.Second}
                    dataframeID={mergeParams.dataframeIDTwo}
                    otherDataframeID={mergeParams.dataframeIDOne}
                    mergeKeyColumnID={mergeParams.mergeKeyColumnIDTwo}

                    setNewDataframeID={(newDataframeID) => {setNewDataframeID(MergeSheet.Second, newDataframeID)}}
                    setNewMergeKeyColumnID={(newMergeKeyColumnID) => setNewMergeKeyColumnID(MergeSheet.Second, newMergeKeyColumnID)}
                />
                <div>
                    <p className='text-header-3'>
                        Columns to Keep
                    </p>
                    {mergeParams.mergeType !== MergeType.UNIQUE_IN_LEFT && 
                        <MultiToggleBox
                            searchable
                            toggleAllIndexes={(indexesToToggle, newToggle) => {
                                const columnIDs = indexesToToggle.map(index => sheetTwoColumnIDsAndDtypesListWithoutMergeKey[index][0]);
                                toggleKeepColumnIDs(MergeSheet.Second, columnIDs, newToggle);
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
                                            toggleKeepColumnIDs(MergeSheet.Second, [columnID], !sheetTwoToggles[index])
                                        }}
                                    />
                                ) 
                            })}
                        </MultiToggleBox>
                    }
                    {mergeParams.mergeType === MergeType.UNIQUE_IN_LEFT &&
                        <p>
                            Finding the unique values in the first sheet doesn&apos;t keep any columns from the second sheet.
                        </p>
                    }
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default MergeTaskpane;