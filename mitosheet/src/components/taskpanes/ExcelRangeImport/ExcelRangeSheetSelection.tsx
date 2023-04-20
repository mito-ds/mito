import React from "react";
import DropdownItem from "../../elements/DropdownItem";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import { ExcelRangeImportParams } from "./ExcelRangeImportTaskpane";

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
            <Row justify="space-between" align="center">
                    <Col>
                        <p className="text-header-3">
                            Find Sheet By
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
                                    subtext="Select a sheet by index to import multiple ranges from. Negative sheet indexes are allowed, and are counted from the end of the sheet list."
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
                                    {props.sheet_names.map((sheet_name, index) => {
                                        return (
                                            <DropdownItem
                                                title={sheet_name}
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
                            <Col>
                                <p className="text-header-3">
                                    Sheet Index
                                </p>
                            </Col>
                            <Col>
                                <Input
                                    type="number"
                                    value={'' + params.sheet.value}
                                    onChange={(e) => {
                                        const newValue = parseInt(e.target.value);
                                        const newParams = {...params};
                                        newParams.sheet.value = newValue;
                                        setParams(newParams);
                                    }}
                                />
                            </Col>
                        </Row>
                        <p className='text-subtext-1'>
                            {sheet_name !== undefined && `${sheet_name} is selected.`}
                            {sheet_name === undefined && `No sheet is selected. The index is out of bounds.`}
                        </p>
                    </>
                }
            
        </>
    )
}

export default ExcelRangeSheetSelection;