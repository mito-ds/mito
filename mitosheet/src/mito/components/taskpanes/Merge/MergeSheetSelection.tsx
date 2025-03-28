/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react"
import { SheetData } from "../../../types";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import { getDefaultMergeParams } from "./MergeTaskpane";
import { MergeParams } from "../../../types";
import '../../../../../css/taskpanes/Merge/MergeSheetAndKeySelection.css'


const MergeSheetSection = (props: {
    params: MergeParams,
    setParams: React.Dispatch<React.SetStateAction<MergeParams>>,
    sheetDataArray: SheetData[]
}): JSX.Element => {

    // We save the df names, so that the new sheet created through the merge cannot be selected
    const [dfNames] = useState(props.sheetDataArray.map(sheetData => sheetData.dfName))

    return (
        <div>
            <Row justify="space-between">
                <Col span={10}>
                    <p className='text-header-3'>
                        First Dataframe
                    </p>
                    <Select
                        value={dfNames[props.params.sheet_index_one] || ''}
                        onChange={(dfName: string) => {
                            const newSheetIndex = dfNames.indexOf(dfName)
                            props.setParams(prevParams => {
                                const newParams = getDefaultMergeParams(props.sheetDataArray, newSheetIndex, prevParams.sheet_index_two, prevParams);
                                return newParams ? newParams : prevParams;
                            })
                        }}
                    >
                        {dfNames.map(dfName => {
                            return (
                                <DropdownItem
                                    key={dfName}
                                    title={dfName}
                                />
                            )
                        })}
                    </Select>
                </Col>
                <Col span={11}>
                    <p className='text-header-3'>
                        Second Dataframe
                    </p>
                    <Select
                        value={dfNames[props.params.sheet_index_two] || ''}
                        onChange={(dfName: string) => {
                            const newSheetIndex = dfNames.indexOf(dfName)
                            props.setParams(prevParams => {
                                const newParams = getDefaultMergeParams(props.sheetDataArray, prevParams.sheet_index_one, newSheetIndex, prevParams);
                                return newParams ? newParams : prevParams;
                            })
                        }}
                    >
                        {dfNames.map(dfName => {
                            return (
                                <DropdownItem
                                    key={dfName}
                                    title={dfName}
                                />
                            )
                        })}
                    </Select>
                </Col>
            </Row>
        </div>
    )
}

export default MergeSheetSection;