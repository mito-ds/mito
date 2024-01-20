import React from "react";
import Select from "../../elements/Select";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import { ExcelRangeColumnEndCondition, ExcelRangeEndCondition, ExcelRangeStartCondition } from "./ExcelRangeImportTaskpane";
import DropdownItem from "../../elements/DropdownItem";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import Input from "../../elements/Input";

interface ExcelRangeDynamicConditionProps<T extends ExcelRangeStartCondition | ExcelRangeEndCondition | ExcelRangeColumnEndCondition> {
    title: string,
    condition: T,
    setCondition: (newCondition: T) => void,
    conditionOptions: Record<string, {
        title: string,
        subtext: string,
        placeholderValue?: string,
    }>
}
function ExcelRangeDynamicCondition<T extends ExcelRangeStartCondition | ExcelRangeEndCondition | ExcelRangeColumnEndCondition> (props: ExcelRangeDynamicConditionProps<T>): JSX.Element {

    //const currentTitle = props.conditionOptions[props.condition.type].title;
    const currentSubtext = props.conditionOptions[props.condition.type].subtext;
    const placeholderValue = props.conditionOptions[props.condition.type].placeholderValue;

    return (
        <>
            <Row justify="space-between" align="center">
                <Col>
                    <p className="text-header-3">
                        {props.title}
                    </p>
                </Col>
            </Row>
            <Row justify="space-between" align="center">
                <Col>
                    <p className="text-body-1">
                        Find By
                    </p>
                </Col>
                <Col>
                    <Select
                        width="medium"
                        value={props.condition.type}
                        onChange={(newType) => {                            
                            const newConditionType = newType;
                            const newCondition: T = {...props.condition, type: newConditionType} as T;
                            
                            // Add the value if there is one
                            if (props.conditionOptions[newConditionType].placeholderValue !== undefined) {
                                (newCondition as unknown as any).value = ''
                            } else if ('value' in newCondition) {
                                delete (newCondition as unknown as any).value;
                            }

                            props.setCondition(newCondition);
                        }}
                    >
                        {Object.entries(props.conditionOptions).map(([type, option]) => {
                            return (
                                <DropdownItem
                                    title={option.title}
                                    id={type}
                                    subtext={option.subtext}
                                    key={type}
                                />
                            )
                        })}                     
                    </Select>
                </Col>
            </Row>
            {'value' in props.condition &&
                <>
                    <Row justify="space-between" align="center">
                        <Col>
                            <LabelAndTooltip 
                                textBody
                                tooltip={currentSubtext}
                            >
                                Value
                            </LabelAndTooltip>
                        </Col>
                        <Col>
                            <Input
                                width="medium"
                                placeholder={placeholderValue}
                                value={'' + props.condition.value}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    props.setCondition({...props.condition, value: newValue});
                                }}
                            />
                        </Col>
                    </Row>
                </>
            }
            
        </>
    )
}

export default ExcelRangeDynamicCondition;