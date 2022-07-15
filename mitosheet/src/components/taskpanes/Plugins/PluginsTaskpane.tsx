// Copyright (c) Mito

import React, { useState } from 'react';
import '../../../../css/taskpanes/Steps/StepTaskpane.css';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, SheetData, UIState } from '../../../types';
import DataframeSelect from '../../elements/DataframeSelect';
import DropdownItem from '../../elements/DropdownItem';
import Select from '../../elements/Select';
import TextButton from '../../elements/TextButton';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';


export type PluginsTaskpaneProps = {
    analysisData: AnalysisData;
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    sheetDataArray: SheetData[];
};

/* 
    Taskpane containing a list of all the custom plugins that allows
    a user to configure them. Nice
*/
function PluginsTaskpane(props: PluginsTaskpaneProps): JSX.Element {

    const [selectedPlugin, setSelectedPlugin] = useState(() => {return props.analysisData.plugins[0].plugin_name})
    const [sheetIndex, setSheetIndex] = useState(0);

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Step History'
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between'>
                    <Col>
                        Custom Transform
                    </Col>
                    <Col>
                        <Select value={selectedPlugin} onChange={setSelectedPlugin}>
                            {props.analysisData.plugins.map(plugin => {
                                return (
                                    <DropdownItem key={plugin.plugin_name} id={plugin.plugin_name} title={plugin.plugin_name}/>
                                )
                            })}
                        </Select>
                    </Col>
                </Row>
                <DataframeSelect sheetDataArray={props.sheetDataArray} sheetIndex={sheetIndex} onChange={setSheetIndex}/>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton 
                    width='block' 
                    variant='dark' 
                    onClick={() => {
                        void props.mitoAPI.editCustomPlugin(selectedPlugin, sheetIndex)
                    }}
                >
                    Execute Transformation
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default PluginsTaskpane;