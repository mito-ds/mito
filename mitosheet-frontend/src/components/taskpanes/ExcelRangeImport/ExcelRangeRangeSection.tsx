import React from "react";
import Input from "../../elements/Input";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import { ExcelRangeImportParams, ExcelRangeRangeImport as ExcelRangeRangeImportSection } from "./ExcelRangeImportTaskpane";


interface ExcelRangeRangeSectionProps {
    rangeImport: ExcelRangeRangeImportSection,
    index: number,
    setParams: React.Dispatch<React.SetStateAction<ExcelRangeImportParams>>
}
const ExcelRangeRangeSection = (props: ExcelRangeRangeSectionProps): JSX.Element => {

    const rangeImport = props.rangeImport;

    return (
        <>
            <Row justify="space-between" align="center">
                <Col>
                    <LabelAndTooltip 
                        textBody
                        tooltip="The proper format is COLUMNROW:COLUMNROW. For example, A1:B10, C10:G1000."
                    >
                        Excel Range
                    </LabelAndTooltip>
                </Col>
                <Col>
                    <Input
                        width="medium"
                        placeholder="A10:C100"
                        value={'' + rangeImport.value}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            props.setParams((prevParams) => {
                                const newRangeImports = window.structuredClone(prevParams.range_imports);
                                const newRangeImport: ExcelRangeRangeImportSection = window.structuredClone(rangeImport);
                                newRangeImport.value = newValue;
                                newRangeImports[props.index] = newRangeImport;
                                return {
                                    ...prevParams,
                                    range_imports: newRangeImports
                                }
                            })
                        }}
                    />
                </Col>
            </Row>
        </>
    )
}

export default ExcelRangeRangeSection;