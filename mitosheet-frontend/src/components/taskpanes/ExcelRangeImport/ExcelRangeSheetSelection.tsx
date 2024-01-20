import React from "react";
import DropdownItem from "../../elements/DropdownItem";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import { ExcelRangeImportParams } from "./ExcelRangeImportTaskpane";
import CollapsibleSection from "../../layout/CollapsibleSection";
import Spacer from "../../layout/Spacer";
import LabelAndTooltip from "../../elements/LabelAndTooltip";

interface ExcelRangeSheetSelectionProps {
    sheet_name: string | undefined;
    sheet_names: string[],
    params: ExcelRangeImportParams,
    setParams: React.Dispatch<React.SetStateAction<ExcelRangeImportParams>>
    
}
function ExcelRangeSheetSelection(props: ExcelRangeSheetSelectionProps): JSX.Element {


    const params = props.params;
    const setParams = props.setParams;
    const sheet_name = props.sheet_name;

    return (
        <>
            <CollapsibleSection title={"Select Sheet"}>
                <Row justify="space-between" align="center">
                    <Col>
                        <p className="text-header-3">
                                Select By
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width="medium"
                            value={params.sheet.type}
                            onChange={(newType) => {
                                const newParams = {...params};
                                newParams.sheet.type = newType as 'sheet name' | 'sheet index';
                                if (newType === 'sheet name') {
                                    newParams.sheet.value = props.sheet_names[0];
                                } else {
                                    newParams.sheet.value = 0;
                                }
                                setParams(newParams);
                            }}
                        >
                            <DropdownItem
                                title='Sheet Name'
                                id="sheet name"
                                subtext="Select a sheet by name to import multiple ranges from."
                            />
                            <DropdownItem
                                title='Sheet Index'
                                id="sheet index"
                                subtext="Select a sheet by index in the Excel file. Use a negative index to count backwards from the end of the sheet list"
                            />                  
                        </Select>
                    </Col>
                </Row>
                {params.sheet.type === 'sheet name' &&
                        <Row justify="space-between" align="center">
                            <Col>
                                <p className="text-header-3">
                                    Sheet Name
                                </p>
                            </Col>
                            <Col>
                                <Select
                                    width="medium"
                                    value={params.sheet.value}
                                    onChange={(newValue) => {
                                        const newParams = {...params};
                                        newParams.sheet.value = newValue;
                                        setParams(newParams);
                                    }}
                                >
                                    {props.sheet_names.map((sheet_name, sheet_index) => {
                                        return (
                                            <DropdownItem
                                                title={sheet_name}
                                                key={sheet_index}
                                            />
                                        )
                                    })}
                                </Select>
                            </Col>
                        </Row>
                }
                {params.sheet.type === 'sheet index' &&
                        <>
                            <Row justify="space-between" align="center">
                                <LabelAndTooltip 
                                    tooltip={"Indexes are 0-based. Use a negative index to count backwards from the end of the sheet list."} 
                                >
                                    Sheet Index
                                </LabelAndTooltip>
                                <Col>
                                    <Input
                                        width="medium"
                                        type="number"
                                        value={'' + params.sheet.value}
                                        onChange={(e) => {
                                            let newValue: string | number = e.target.value;
                                            const parsedValue = parseInt(newValue);
                                            if (!isNaN(parsedValue)) {
                                                newValue = parsedValue;
                                            }
                                            const newParams = {...params};
                                            newParams.sheet.value = newValue;
                                            setParams(newParams);
                                        }}
                                    />
                                </Col>
                            </Row>
                            <p className='text-subtext-1'>
                                {sheet_name !== undefined && `${sheet_name} is selected.`}
                                {sheet_name === undefined && `No sheet is selected. The index is out of bounds or invalid.`}
                            </p>
                        </>
                }
            </CollapsibleSection>
            <Spacer px={10}/>
        </>
    )
}

export default ExcelRangeSheetSelection;