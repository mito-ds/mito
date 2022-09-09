import React from 'react';
import { ColumnID, ConditionalFormat, DataframeFormat, RecursivePartial, SheetData } from '../../../types';
import '../../../../css/taskpanes/ConditionalFormatting/ConditionalFormattingCard.css'
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import XIcon from '../../icons/XIcon';
import { Filter } from '../ControlPanel/FilterAndSortTab/filter/Filter';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import { getDisplayColumnHeader, getFirstCharactersOfColumnHeaders } from '../../../utils/columnHeaders';
import { getDtypeValue } from '../ControlPanel/FilterAndSortTab/DtypeCard';
import { addIfAbsent, removeIfPresent, toggleInArray } from '../../../utils/arrays';
import LabelAndColor from '../../../pro/graph/LabelAndColor';
import { ODD_ROW_BACKGROUND_COLOR_DEFAULT, ODD_ROW_TEXT_COLOR_DEFAULT } from '../../endo/GridData';
import { ALL_SELECT_OPTIONS } from '../ControlPanel/FilterAndSortTab/filter/filterConditions';
import { capitalizeFirstLetter } from '../../../utils/strings';
import ConditionalFormatIcon from '../../icons/ConditionalFormatIcon';
import ConditionalFormatInvalidIcon from '../../icons/ConditionalFormatInvalidIcon';
import UpArrowIcon from '../../icons/UpArrowIcon';
import DownArrowIcon from '../../icons/DownArrowIcon';



interface ConditionalFormattingProps {
    df_format: DataframeFormat,
    conditionalFormat: ConditionalFormat,
    updateDataframeFormatParams: (df_format: RecursivePartial<DataframeFormat>) => void;
    index: number,
    sheetData: SheetData;
    openFormattingCardIdx: number
    setOpenFormattingCardIdx: React.Dispatch<React.SetStateAction<number>>
}


const getColumnHeadersIncludedMessage = (sheetData: SheetData, columnIDs: ColumnID[]): JSX.Element => {
    if (columnIDs.length === 0) {
        return (<p>Applied to 0 columns.</p>)
    } 

    const columnHeaders = columnIDs.map(columnID => sheetData.columnIDsMap[columnID]).filter(columnHeader => columnHeader !== undefined);
    const [columnHeadersString, numOtherColumnHeaders] = getFirstCharactersOfColumnHeaders(columnHeaders, 15)
    
    if (numOtherColumnHeaders === 0) {
        return (<p>Applied to <span className='text-color-gray-important'>{columnHeadersString}</span>.</p>)
    } else {
        return (<p>Applied to <span className='text-color-gray-important'>{columnHeadersString}</span> and <span className='text-color-gray-important'>{numOtherColumnHeaders}</span> others.</p>)
    }
}

const getInvalidColumnHeadersMessage = (sheetData: SheetData, invalidColumnIDs: ColumnID[]): JSX.Element | null => {
    if (invalidColumnIDs.length === 0) {
        return null
    } 

    // Sort
    const allColumnIDs = Object.keys(sheetData.columnIDsMap);
    const sortedColumnIDs = invalidColumnIDs.sort((a, b) => {
        return allColumnIDs.indexOf(a) - allColumnIDs.indexOf(b);
    })
    

    const columnHeaders = sortedColumnIDs.map(columnID => sheetData.columnIDsMap[columnID]).filter(columnHeader => columnHeader !== undefined);
    const [columnHeadersString, numOtherColumnHeaders] = getFirstCharactersOfColumnHeaders(columnHeaders, 25)
    
    if (numOtherColumnHeaders === 0) {
        return (<p><span className='text-color-error-important'>{columnHeadersString}</span> are invalid.</p>)
    } else {
        return (<p><span className='text-color-error-important'>{columnHeadersString}</span> and <span className='text-color-error-important'>{numOtherColumnHeaders}</span> others are invalid.</p>)
    }
}


const ConditionalFormattingCard = (props: ConditionalFormattingProps): JSX.Element => {
    
    const onDelete = () => {
        const newConditionalFormats = [...props.df_format.conditional_formats];
        newConditionalFormats.splice(props.index, 1);
        props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
    }

    const XElement = (
        <Col title='Delete conditional formatting rule'>
            <XIcon 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            ></XIcon>
        </Col>
    );
    
    // TODO: should we sort these
    const invalidColumnIDs = (props.sheetData.conditionalFormattingResult?.invalid_conditional_formats[props.conditionalFormat.format_uuid] || []);
    const invalidColumnIDMessage = getInvalidColumnHeadersMessage(props.sheetData, invalidColumnIDs);

    const conditionText = capitalizeFirstLetter((ALL_SELECT_OPTIONS[props.conditionalFormat.filters[0]?.condition]['long_name'] || ''));

    const color = props.conditionalFormat.color || ODD_ROW_TEXT_COLOR_DEFAULT;
    const backgroundColor = props.conditionalFormat.backgroundColor || ODD_ROW_BACKGROUND_COLOR_DEFAULT;
        
    if (props.openFormattingCardIdx !== props.index) {
        return (
            <div className='conditional-format-card' onClick={() => props.setOpenFormattingCardIdx(props.index)}> 
                <Row justify='space-between' align='center'>
                    <Row suppressTopBottomMargin align='center' justify='start'>
                        <Col offsetRight={1}>
                            {invalidColumnIDs.length === 0 &&
                                <ConditionalFormatIcon
                                    color={color}
                                    backgroundColor={backgroundColor}
                                />
                            }
                            {invalidColumnIDs.length !== 0 &&
                                <ConditionalFormatInvalidIcon
                                    color={color}
                                    backgroundColor={backgroundColor}
                                />
                            }
                        </Col>
                        <Col>
                            <div className='flex flex-column'>
                                <p className='text-body-1'>
                                    {conditionText} {props.conditionalFormat.filters[0]?.value}
                                </p>
                                <p className='text-body-2'>
                                    {getColumnHeadersIncludedMessage(props.sheetData, props.conditionalFormat.columnIDs)}
                                </p>
                            </div>
                        </Col>
                    </Row>
                    <Row align='top' justify='end'>
                        <div className='mr-5px' title='Configure conditional formatting rule'>
                            <UpArrowIcon/>
                        </div>
                        {XElement}
                    </Row>
                </Row>
            </div>
        )
    } else {
        return (
            <div className='conditional-format-card'> 
                <Row justify='space-between' onClick={() => props.setOpenFormattingCardIdx(-1)}>
                    <Col span={12}>
                        <p className='text-header-3'>
                            Columns to format
                        </p>
                    </Col>
                    <Row justify='end'>
                        <div className='mr-5px' title='Close conditional formatting configuration'>
                            <DownArrowIcon/>
                        </div>
                        {XElement}
                    </Row>
                </Row>
                <MultiToggleBox
                    searchable
                    toggleAllIndexes={(indexesToToggle, newToggle) => {
                        const columnIDs = Object.keys(props.sheetData?.columnDtypeMap || {})
                            .map((columnID) => {return columnID})
                            .filter((_, index) => {
                                return indexesToToggle.includes(index);
                            });

                        const newSelectedColumnIDs = [...props.conditionalFormat.columnIDs];
                        if (newToggle) {
                            columnIDs.forEach((columnID) => {
                                addIfAbsent(newSelectedColumnIDs, columnID);
                            })
                        } else {
                            columnIDs.forEach((columnID) => {
                                removeIfPresent(newSelectedColumnIDs, columnID);
                            })
                        }
                        const newConditionalFormats = [...props.df_format.conditional_formats];
                        newConditionalFormats[props.index].columnIDs = newSelectedColumnIDs;

                        props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                    }}
                    height='medium'
                >
                    {Object.entries(props.sheetData?.columnDtypeMap || {}).map(([columnID, columnDtype], index) => {
                        const columnHeader = props.sheetData.columnIDsMap[columnID];
                        const toggled = props.conditionalFormat.columnIDs.includes(columnID);
                        const isInvalid = invalidColumnIDs.includes(columnID); // If it's invalid, we merge
                        return (
                            <MultiToggleItem
                                key={index}
                                title={getDisplayColumnHeader(columnHeader) + (isInvalid ? "(invalid)" : '')}
                                rightText={getDtypeValue(columnDtype)}
                                toggled={toggled}
                                index={index}
                                onToggle={() => {
                                    const newSelectedColumnIDs = [...props.conditionalFormat.columnIDs];
                                    toggleInArray(newSelectedColumnIDs, columnID);
                                    const newConditionalFormats = [...props.df_format.conditional_formats];
                                    newConditionalFormats[props.index].columnIDs = newSelectedColumnIDs;
            
                                    props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                                }}
                            />
                        ) 
                    })}
                </MultiToggleBox>
                {invalidColumnIDMessage}
                <Filter
                    filter={props.conditionalFormat.filters[0]}
                    columnDtype={undefined}
                    operator={"And"}
                    displayOperator={false}
                    setFilter={(newFilter) => {
                        const newConditionalFormats = [...props.df_format.conditional_formats];
                        newConditionalFormats[props.index].filters = [newFilter];
                        props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                    }}
                    nameLength='long_name'
                />
                <LabelAndColor 
                    label="Text Color"
                    color={color}
                    onChange={(newColor) => {
                        const newConditionalFormats = [...props.df_format.conditional_formats];
                        newConditionalFormats[props.index].color = newColor;
                        props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                    }}              
                />
                <LabelAndColor 
                    label="Background Color"
                    color={backgroundColor}
                    onChange={(newColor) => {
                        const newConditionalFormats = [...props.df_format.conditional_formats];
                        newConditionalFormats[props.index].backgroundColor = newColor;
                        props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                    }}              
                />

            
            </div>
        )
    }
}

export default ConditionalFormattingCard;