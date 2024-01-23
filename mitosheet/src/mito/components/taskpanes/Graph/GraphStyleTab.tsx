// Copyright (c) Saga Inc.

import React from 'react';
import { GraphParamsFrontend, RecursivePartial } from '../../../types';
import { updateObjectWithPartialObject } from '../../../utils/objects';
import Input from '../../elements/Input';
import Col from '../../layout/Col';
import Row from '../../layout/Row';


/* 
    Contains all of the options for styling graphs,
    like setting the title and axis labels
*/
function GraphStyleTab(props: {
    graphParams: GraphParamsFrontend
    setGraphParams: React.Dispatch<React.SetStateAction<GraphParamsFrontend>>;
    selectedGraphElement: 'xtitle' | 'ytitle' | 'gtitle' | null;
}): JSX.Element {

    const graphStylingParams = props.graphParams.graphStyling;

    function updateGraphParam(update: RecursivePartial<GraphParamsFrontend>): void {
        props.setGraphParams(prevGraphParams => {
            return updateObjectWithPartialObject(prevGraphParams, update);
        })
    }

    return ( 
        <div className='graph-sidebar-toolbar-content'>   
            {props.selectedGraphElement === 'gtitle' && <Row justify='space-between' align='center'>
                <Col>
                    <p>
                            Graph Title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.title.title || ''}
                    placeholder="Default Graph Title"
                    onChange={(e) => {
                        // We set it to undefined so that the backend knows we're not trying to set a custom axis label 
                        const newTitle =  e.target.value !== '' ? e.target.value : undefined
                        return updateGraphParam({graphStyling: {title: {title: newTitle}}});
                    }}
                />
            </Row>
            }
            {(props.selectedGraphElement === 'xtitle' && props.graphParams.graphStyling.xaxis.visible) && <Row justify='space-between' align='center'>
                <Col>
                    <p>
                            X Axis Title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.xaxis.title || ''}
                    placeholder="Default X Axis"
                    onChange={(e) => {
                        // We set it to undefined so that the backend knows we're not trying to set a custom axis label 
                        const newTitle =  e.target.value !== '' ? e.target.value : undefined
                        return updateGraphParam({graphStyling: {xaxis: {title: newTitle}}});

                    }}
                />
            </Row>}
            {(props.selectedGraphElement === 'ytitle' && props.graphParams.graphStyling.yaxis.visible) && <Row justify='space-between' align='center'>
                <Col>
                    <p>
                            Y Axis Title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.yaxis.title || ''}
                    placeholder="Default Y Axis"
                    onChange={(e) => {
                        const newTitle = e.target.value !== '' ? e.target.value : undefined
                        return updateGraphParam({graphStyling: {yaxis: {title: newTitle}}});

                    }}
                />
            </Row>}
            <Row justify='space-between' align='center' title='Title of legend'>
                <Col>
                    <p>
                            Legend title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.legend.title?.text ? graphStylingParams.legend.title.text : ''} 
                    width='medium'
                    placeholder='Legend title'
                    onChange={(e) => {
                        const newLegendTitle = e.target.value
                        return updateGraphParam({graphStyling: {legend: {title: {text: newLegendTitle}}}});

                    }}     
                />
            </Row>
        </div> 
    )
} 

export default GraphStyleTab;



