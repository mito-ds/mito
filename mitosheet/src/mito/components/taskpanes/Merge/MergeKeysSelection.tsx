import React from "react"
import { ColumnID, SheetData } from "../../../types";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import TextButton from "../../elements/TextButton";
import XIcon from "../../icons/XIcon";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";
import { MergeParams } from "../../../types";
import { getFirstSuggestedMergeKeys } from "./mergeUtils";
import CautionIcon from "../../icons/CautionIcon";
import TriangleExpandCollapseIcon from "../../icons/TriangleExpandCollapseIcon";

const ExpandableWarning = (props: {warnings: string[]}): JSX.Element => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    if (props.warnings.length === 0) {
        return <></>;
    } else if (props.warnings.length === 1) {
        return (
            <div className='caution-text-container'>
                <div>
                    <CautionIcon width={'50px'} height={'30px'} color='var(--mito-status-warning-dark)'/>
                    <p className='caution-text'>{props.warnings[0]}</p>
                </div>
            </div> 
        )
    } else {
        return (
            <div
                className="caution-text-container expandable-caution-text-container"
                style={{
                    background: 'var(--mito-status-warning)',
                    border: '1px solid var(--mito-status-warning-dark)'
                }}
                onClick={(e) => {
                    setIsExpanded(!isExpanded);
                    e.stopPropagation();
                }}
            >
                <div
                    style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between'}}
                >
                    <CautionIcon width={'50px'} height={'30px'} color='var(--mito-status-warning-dark)'/>
                    <p className='caution-text'>{`${props.warnings.length} merge key pairings were removed because at least one of the merge keys was missing from the source tabs.`}</p>
                    <TriangleExpandCollapseIcon
                        action={isExpanded ? 'collapse' : 'expand'}
                    />
                </div>
                {
                    isExpanded &&
                    (<ul style={{margin: '4px 0'}}>
                        {props.warnings.map((warning, index) => {
                            return (
                                <li className='caution-text' key={index}>
                                    {warning}
                                </li>
                            )
                        })}
                    </ul>)
                }
            </div>
        )
    }
}

const MergeKeysSelectionSection = (props: {
    params: MergeParams,
    setParams: React.Dispatch<React.SetStateAction<MergeParams>>,
    sheetDataArray: SheetData[],
    error: string | undefined;
    warnings: string[] | undefined;
}): JSX.Element => {

    const sheetDataOne = props.sheetDataArray[props.params.sheet_index_one];
    const sheetDataTwo = props.sheetDataArray[props.params.sheet_index_two];
    const noPossibleMergeKeys = Object.keys(sheetDataOne?.columnDtypeMap || {}).length === 0 || Object.keys(sheetDataTwo?.columnDtypeMap || {}).length === 0;
    const [hasClicked, setHasClicked] = React.useState(false);

    return (
        <div onClick={() => setHasClicked(true)} className="expandable-content-card">
            <Row suppressTopBottomMargin>
                <Col>
                    <p className="text-header-3">
                        Match rows where:
                    </p>
                </Col>
            </Row>
            {props.params.merge_key_column_ids.map(([mergeKeyColumnIDOne, mergeKeyColumnIDTwo], index) => {
                return (
                    <Row key={index} justify="start" align="center">
                        <Col span={10}>
                            <Select
                                value={mergeKeyColumnIDOne}
                                onChange={(columnID: ColumnID) => {
                                    props.setParams(prevParams => {
                                        const newMergeKeys = [...prevParams.merge_key_column_ids];
                                        newMergeKeys[index][0] = columnID
                                        return {
                                            ...prevParams,
                                            merge_key_column_ids: newMergeKeys
                                        }
                                    })
                                }}
                                searchable
                            >
                                {Object.entries(sheetDataOne?.columnIDsMap || {}).map(([columnID, columnHeader]) => {
                                    return (
                                        <DropdownItem
                                            key={columnID}
                                            id={columnID}
                                            title={getDisplayColumnHeader(columnHeader)}
                                        />
                                    )
                                })}
                            </Select>
                        </Col>
                        <Col className="text-header-3" span={.5} offset={.5} offsetRight={.5}>
                            =
                        </Col>
                        <Col span={10}>
                            <Select
                                value={mergeKeyColumnIDTwo}
                                onChange={(columnID: ColumnID) => {
                                    props.setParams(prevParams => {
                                        const newMergeKeys = [...prevParams.merge_key_column_ids];
                                        newMergeKeys[index][1] = columnID
                                        return {
                                            ...prevParams,
                                            merge_key_column_ids: newMergeKeys
                                        }
                                    })
                                }}
                                searchable
                            >
                                {Object.entries(sheetDataTwo?.columnIDsMap || {}).map(([columnID, columnHeader]) => {
                                    return (
                                        <DropdownItem
                                            key={columnID}
                                            id={columnID}
                                            title={getDisplayColumnHeader(columnHeader)}
                                        />
                                    )
                                })}
                            </Select>
                        </Col>
                        <Col span={2} offset={.5}>
                            <XIcon
                                onClick={() => {
                                    props.setParams(prevParams => {
                                        const newMergeKeys = [...prevParams.merge_key_column_ids];
                                        newMergeKeys.splice(index, 1)
                                        return {
                                            ...prevParams,
                                            merge_key_column_ids: newMergeKeys
                                        }
                                    })
                                }}
                            />
                        </Col>
                    </Row>
                )
            })}
            {props.error !== undefined && 
                <p className='text-color-error'>
                    {props.error}
                </p>    
            }
            {
                (props.warnings !== undefined && !hasClicked) && <ExpandableWarning warnings={props.warnings}/>
            }
            <Spacer px={15}/>
            <TextButton 
                width="medium"
                variant="dark"
                onClick={() => {
                    props.setParams(prevParams => {
                        const newMergeKeys = [...prevParams.merge_key_column_ids];
                        const newSuggestedMergeKeys = getFirstSuggestedMergeKeys(props.sheetDataArray, props.params.sheet_index_one, props.params.sheet_index_two, props.params.merge_key_column_ids);
                        
                        if (newSuggestedMergeKeys) {
                            newMergeKeys.push(newSuggestedMergeKeys);
                        }
                        
                        return {
                            ...prevParams,
                            merge_key_column_ids: newMergeKeys
                        };
                    })
                }}
                disabled={noPossibleMergeKeys}
                disabledTooltip={'One of these dataframes has no columns, so no merge keys can be added.'}
            >
                + Add Merge Keys
            </TextButton>
        </div>
    )
}

export default MergeKeysSelectionSection;