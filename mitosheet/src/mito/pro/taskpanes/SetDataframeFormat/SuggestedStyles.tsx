import React from 'react';
import { DataframeFormat, RecursivePartial } from '../../../../types';
import { HEADER_TEXT_COLOR_DEFAULT } from '../../../components/endo/ColumnHeader';
import { EVEN_ROW_TEXT_COLOR_DEFAULT, ODD_ROW_TEXT_COLOR_DEFAULT } from '../../../components/endo/GridData';
import SuggestedStyle1Icon from '../../../components/icons/SuggestedStyle1Icon';
import SuggestedStyle2Icon from '../../../components/icons/SuggestedStyle2Icon';
import SuggestedStyle3Icon from '../../../components/icons/SuggestedStyle3Icon';
import SuggestedStyle4Icon from '../../../components/icons/SuggestedStyle4Icon';
import SuggestedStyle5Icon from '../../../components/icons/SuggestedStyle5Icon';
import Col from '../../../components/layout/Col';
import Row from '../../../components/layout/Row';


const SuggestedStyles = (props: {
    updateDataframeFormatParams: (newParams: RecursivePartial<DataframeFormat>) => void
}): JSX.Element => {
    return (
        <>
            <Row>
                <Col>
                    <p className='text-header-3'>
                        Suggested Styles
                    </p>
                </Col>
            </Row>
            <Row justify='space-between' align='center'>
                <div onClick={() => {
                    // Just clearing out the data sets it to the default
                    props.updateDataframeFormatParams({
                        headers: {color: undefined, backgroundColor: undefined}, 
                        rows: {even: {color: undefined, backgroundColor: undefined}, odd: {color: undefined, backgroundColor: undefined}},
                        border: {borderStyle: undefined, borderColor: undefined}
                    })
                }}>
                    <SuggestedStyle1Icon/>
                </div>
                <div onClick={() => {
                    props.updateDataframeFormatParams({
                        headers: {
                            color: HEADER_TEXT_COLOR_DEFAULT,
                            backgroundColor: '#9B9B9D'
                        }, 
                        rows: {even: {color: EVEN_ROW_TEXT_COLOR_DEFAULT, backgroundColor: undefined}, odd: {color: ODD_ROW_TEXT_COLOR_DEFAULT, backgroundColor: undefined}},
                        border: {borderStyle: undefined, borderColor: undefined}
                    })
                }}>
                    <SuggestedStyle2Icon/>
                </div>
                <div onClick={() => {
                    props.updateDataframeFormatParams({
                        headers: {
                            color: '#FFFFFF',
                            backgroundColor: '#549D3A'
                        }, 
                        rows: {even: {color: EVEN_ROW_TEXT_COLOR_DEFAULT, backgroundColor: '#D0E3C9'}, odd: {color: ODD_ROW_TEXT_COLOR_DEFAULT, backgroundColor: undefined}},
                        border: {borderStyle: undefined, borderColor: undefined}
                    })
                }}>
                    <SuggestedStyle3Icon/>
                </div>
                <div onClick={() => {
                    props.updateDataframeFormatParams({
                        headers: {
                            color: '#FFFFFF',
                            backgroundColor: '#4D73BE'
                        }, 
                        rows: {even: {color: EVEN_ROW_TEXT_COLOR_DEFAULT, backgroundColor: '#DAE1F0'}, odd: {color: ODD_ROW_TEXT_COLOR_DEFAULT, backgroundColor: undefined}},
                        border: {borderStyle: undefined, borderColor: undefined}
                    })
                }}>
                    <SuggestedStyle4Icon/>
                </div>
                <div onClick={() => {
                    props.updateDataframeFormatParams({
                        headers: {
                            color: '#FFFFFF',
                            backgroundColor: '#8F1B15'
                        }, 
                        rows: {even: {color: EVEN_ROW_TEXT_COLOR_DEFAULT, backgroundColor: '#F0DADA'}, odd: {color: ODD_ROW_TEXT_COLOR_DEFAULT, backgroundColor: undefined}},
                        border: {borderStyle: undefined, borderColor: undefined}
                    })
                }}>
                    <SuggestedStyle5Icon/>
                </div>
            </Row>
        </>
    )
}

export default SuggestedStyles;