import React from "react";
import Row from "../layout/Row";
import Col from "../layout/Col";
import LabelAndTooltip from "./LabelAndTooltip";
import Select from "./Select";
import DropdownItem from "./DropdownItem";
import Input from "./Input";

type EveryDayAutomationSchedule = {
    type: 'Every Day',
    time: string
}

type EveryWeekAutomationSchedule = {
    type: 'Every Week',
    dayOfWeek: number,
    time: string
}

type EveryMonthAutomationSchedule = {
    type: 'Every Month',
    dayOfMonth: number,
    time: string
}

export type AutomationScheduleType = EveryDayAutomationSchedule | EveryWeekAutomationSchedule | EveryMonthAutomationSchedule;

type AutomationSchedulePickerProps = {
    schedule: AutomationScheduleType,
    setSchedule: (schedule: AutomationScheduleType) => void;
}

const AutomationSchedule = (props: AutomationSchedulePickerProps): JSX.Element => {

    const schedule = props.schedule;

    return (
        <div className="mito-blue-container">
            <Row justify='space-between' align='center'>
                <Col>
                    <LabelAndTooltip tooltip="Select the timeframe to rerun your automation in.">
                        Run on
                    </LabelAndTooltip>
                </Col>
                <Col>
                    <Select
                        width="medium"
                        value={props.schedule.type}
                        onChange={(newValue) => {
                            if (newValue === 'Every Day') {
                                props.setSchedule({
                                    ...props.schedule,
                                    type: 'Every Day',
                                })
                            } else if (newValue === 'Every Week') {
                                props.setSchedule({
                                    ...props.schedule,
                                    dayOfWeek: 1,
                                    type: 'Every Week',
                                })
                            } else if (newValue === 'Every Month') {
                                props.setSchedule({
                                    ...props.schedule,
                                    dayOfMonth: 1,
                                    type: 'Every Month',
                                })
                            }
                        }}
                    >
                        <DropdownItem title='Every Day'/>
                        <DropdownItem title='Every Week'/>
                        <DropdownItem title='Every Month'/>
                    </Select>
                </Col>
            </Row>
            {schedule.type === 'Every Week' && 
                <Row justify='space-between' align='center'>
                    <Col>
                        <LabelAndTooltip tooltip="Select the day of the week to rerun your automation on.">
                            On day
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Select
                            width="medium"
                            value={schedule.dayOfWeek + ''}
                            onChange={(newValue) => {
                                props.setSchedule({
                                    ...schedule,
                                    dayOfWeek: parseInt(newValue),
                                })
                            }}
                        >
                            <DropdownItem title='Monday' id='1'/>
                            <DropdownItem title='Tuesday' id='2'/>
                            <DropdownItem title='Wednesday' id='3'/>
                            <DropdownItem title='Thursday' id='4'/>
                            <DropdownItem title='Friday' id='5'/>
                            <DropdownItem title='Saturday' id='6'/>
                            <DropdownItem title='Sunday' id='7'/>
                        </Select>
                    </Col>
                </Row>
            }
            {schedule.type === 'Every Month' &&
                <Row justify='space-between' align='center'>
                    <Col>
                        <LabelAndTooltip tooltip="Select the day of the month to rerun your automation on.">
                            On day
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Select
                            width="medium"
                            value={schedule.dayOfMonth + ''}
                            onChange={(newValue) => {
                                props.setSchedule({
                                    ...schedule,
                                    dayOfMonth: parseInt(newValue),
                                })
                            }}
                        >
                            {Array.from(Array(31).keys()).map((day) => {
                                return <DropdownItem title={day + 1 + ''} id={day + 1 + ''} key={day}/>
                            })}
                        </Select>
                    </Col>
                </Row>
            }
            <Row justify='space-between' align='center'>
                <Col >
                    <LabelAndTooltip tooltip="Select the day of the month to rerun your automation on.">
                        At time
                    </LabelAndTooltip>
                </Col>
                <Col>
                    <Input
                        width="medium"
                        type='time'
                        value={schedule.time}
                        onChange={(e) => {
                            const newTime = e.target.value;
                            props.setSchedule({
                                ...schedule,
                                time: newTime,
                            })
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default AutomationSchedule;