import React, { useEffect, useState } from "react";
import MitoAPI from "../../../api";
import { ConcatParams, SheetData, UIState } from "../../../types"
import DropdownButton from "../../elements/DropdownButton";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import SelectAndXIconCard from "../../elements/SelectAndXIconCard";
import Toggle from "../../elements/Toggle";
import Col from "../../spacing/Col";
import Row from "../../spacing/Row";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";



interface ConcatTaskpaneProps {
    mitoAPI: MitoAPI;
    sheetDataArray: SheetData[];
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

const ConcatTaskpane = (props: ConcatTaskpaneProps): JSX.Element => {

    const [stepID, setStepID] = useState<string | undefined>(undefined);
    const [concatParams, setConcatParams] = useState<ConcatParams>({
        join: 'inner',
        ignore_index: true,
        sheetIndexes: []
    })
    const [updateNumber, setUpdateNumber] = useState(0)

    // Make sure the user cannot select the newly created dataframe
    const [selectableSheetIndexes] = useState(props.sheetDataArray.map((sd, index) => index));

    useEffect(() => {
        if (updateNumber === 0) {
            return;
        }

        sendConcatEdit()
    }, [updateNumber])

    // TODO: make it work with undo

    const sendConcatEdit = async () => {
        const _stepID = await props.mitoAPI.editConcat(
            concatParams,
            stepID
        )
        setStepID(_stepID);
    }


    if (props.sheetDataArray.length < 2) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState} message="Import at least two datasets before concating."/>)
    }

    const dataframeCards: JSX.Element[] = concatParams.sheetIndexes.map((sheetIndex, arrIndex) => {
        return (
            <SelectAndXIconCard 
                key={arrIndex}
                titleMap={Object.fromEntries(props.sheetDataArray.map((sheetData, index) => {
                    return [index + '', sheetData.dfName]
                }))}
                value={sheetIndex + ''}
                onChange={(newSheetIndexStr) => {
                    const newSheetIndex = parseInt(newSheetIndexStr);
                    setConcatParams(prevConcatParams => {
                        const newSheetIndexes = [...prevConcatParams.sheetIndexes];
                        newSheetIndexes[arrIndex] = newSheetIndex;

                        return {
                            ...prevConcatParams,
                            sheetIndexes: newSheetIndexes
                        }
                    })
                    setUpdateNumber(old => old + 1);
                }}
                onDelete={() => {
                    setConcatParams(prevConcatParams => {
                        const newSheetIndexes = [...prevConcatParams.sheetIndexes];
                        newSheetIndexes.splice(arrIndex, 1);

                        return {
                            ...prevConcatParams,
                            sheetIndexes: newSheetIndexes
                        }
                    })
                    setUpdateNumber(old => old + 1);
                }}
                selectableValues={Object.keys(props.sheetDataArray)} // Note the cast to strings
            />
        )
    })
          

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Concatenate dataframes"
                setUIState={props.setUIState}            
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Join Type
                        </p>
                    </Col>
                    <Col>
                        <Select 
                            value={concatParams.join}
                            onChange={(newJoin: string) => {
                                setConcatParams(prevConcatParams => {
                                    return {
                                        ...prevConcatParams,
                                        join: newJoin as 'inner' | 'outer'
                                    }
                                })
                                setUpdateNumber(old => old + 1)
                            }}
                            width='medium'
                        >
                            <DropdownItem
                                title='inner'
                                subtext="Only includes columns that have matches in all sheets."
                            />
                            <DropdownItem
                                title="outer"
                                subtext="Includes all columns from all sheets, regardless of if there is a match in the other sheets."
                            />
                        </Select>
                    </Col>
                </Row>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Ignore Existing Indexes
                        </p>
                    </Col>
                    <Col>
                        <Toggle 
                            value={concatParams.ignore_index}
                            onChange={() => {
                                setConcatParams(prevConcatParams => {
                                    return {
                                        ...prevConcatParams,
                                        ignore_index: !prevConcatParams.ignore_index
                                    }
                                })
                                setUpdateNumber(old => old + 1)
                            }}                      
                        />
                    </Col>
                </Row>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Dataframes to Concatenate
                        </p>
                    </Col>
                    <Col>
                        <DropdownButton
                            text='+ Add'
                            width='small'
                            searchable
                        >
                            {props.sheetDataArray.filter((sheetData, index) => {
                                if (!selectableSheetIndexes.includes(index)) {
                                    return false;
                                }
                                return true;
                            }).map((sheetData, index) => {
                                return (
                                    <DropdownItem
                                        key={index}
                                        title={sheetData.dfName}
                                        onClick={() => {
                                            setConcatParams(prevConcatParams => {
                                                const newSheetIndexes = [...prevConcatParams.sheetIndexes];
                                                newSheetIndexes.push(index);
                        
                                                return {
                                                    ...prevConcatParams,
                                                    sheetIndexes: newSheetIndexes
                                                }
                                            })
                                            setUpdateNumber(old => old + 1);
                                        }}
                                    />
                                )
                            })}
                        </DropdownButton>
                    </Col>
                </Row>
                {dataframeCards}
            </DefaultTaskpaneBody>

        </DefaultTaskpane>
    )
}

export default ConcatTaskpane;