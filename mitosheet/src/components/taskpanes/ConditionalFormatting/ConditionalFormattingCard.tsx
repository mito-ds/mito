import React, { useState } from 'react';
import { ConditionalFormat, DataframeFormat, RecursivePartial, SheetData } from '../../../types';
import '../../../../css/taskpanes/ConditionalFormatting/ConditionalFormattingCard.css'
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import XIcon from '../../icons/XIcon';
import { Filter } from '../ControlPanel/FilterAndSortTab/filter/Filter';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { getDtypeValue } from '../ControlPanel/FilterAndSortTab/DtypeCard';
import { addIfAbsent, removeIfPresent, toggleInArray } from '../../../utils/arrays';
import LabelAndColor from '../../../pro/graph/LabelAndColor';
import { ODD_ROW_BACKGROUND_COLOR_DEFAULT, ODD_ROW_TEXT_COLOR_DEFAULT } from '../../endo/GridData';



interface ConditionalFormattingProps {
    df_format: DataframeFormat,
    conditionalFormat: ConditionalFormat,
    updateDataframeFormatParams: (df_format: RecursivePartial<DataframeFormat>) => void;
    index: number,
    sheetData: SheetData;
}

const ConditionalFormattingCard = (props: ConditionalFormattingProps): JSX.Element => {
    const [open, setOpen] = useState(false);
    
    const onDelete = () => {
        const newConditionalFormats = [...props.df_format.conditional_formats];
        newConditionalFormats.splice(props.index, 1);
        props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
    }

    const XElement = (
        <Col span={2}>
            <XIcon 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            ></XIcon>
        </Col>
    );

    if (!open) {
        return (
            <div className='conditional-format-card' onClick={() => setOpen(true)}> 
                <Row justify='space-between' align='center'>
                    <Row suppressTopBottomMargin align='center' justify='start'>
                        <Col span={2}>
                            II
                        </Col>
                        <Col>
                            <div className='flex flex-column'>
                                <p className='text-body-1'>
                                    Filter
                                </p>
                                <p className='text-body-2'>
                                    Columns
                                </p>
                            </div>
                        </Col>
                    </Row>
                    {XElement}
                </Row>
            
            </div>
        )
    } else {
        return (
            <div className='conditional-format-card'> 
                <Row justify='space-between' onClick={() => setOpen(false)}>
                    <Col>
                        <p className='text-header-3'>
                            Columns to format
                        </p>
                    </Col>
                    {XElement}
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
                        const toggled = props.conditionalFormat.columnIDs.includes(columnID); // TODO: make it true if merge key with OR
                        return (
                            <MultiToggleItem
                                key={index}
                                title={getDisplayColumnHeader(columnHeader)}
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
                <Filter
                    first
                    filter={props.conditionalFormat.filters[0]}
                    columnDtype={undefined}
                    operator={"And"}
                    displayOperator={false}
                    setFilter={(newFilter) => {}}
                    setOperator={(operator) => {}}
                    deleteFilter={() => {}}                    
                />

                <Row justify='start'>
                    <Col>
                        <p className='text-header-4'>
                            Set Formatting
                        </p>
                    </Col>
                </Row>
                <LabelAndColor 
                    label="Text Color"
                    color={props.conditionalFormat.color || ODD_ROW_TEXT_COLOR_DEFAULT}
                    onChange={(newColor) => {
                        const newConditionalFormats = [...props.df_format.conditional_formats];
                        newConditionalFormats[props.index].color = newColor;
                        props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                    }}              
                />
                <LabelAndColor 
                    label="Background Color"
                    color={props.conditionalFormat.backgroundColor || ODD_ROW_BACKGROUND_COLOR_DEFAULT}
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