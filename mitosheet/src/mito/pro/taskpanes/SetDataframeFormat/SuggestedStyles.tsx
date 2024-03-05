import React from 'react';
import { ROW_TEXT_COLOR_DEFAULT } from '../../../components/endo/GridData';
import SuggestedStyleIcon from '../../../components/icons/SuggestedStyleIcon';
import Col from '../../../components/layout/Col';
import Row from '../../../components/layout/Row';
import { DataframeFormat, RecursivePartial } from '../../../types';

const DARK_TEXT_COLOR = '#494650';

const DEFAULT_SUGGESTED_STYLES: RecursivePartial<DataframeFormat>[] = [
    {
        headers: {color: undefined, backgroundColor: undefined}, 
        rows: {even: {color: undefined, backgroundColor: undefined}, odd: {color: undefined, backgroundColor: undefined}},
        border: {borderStyle: undefined, borderColor: undefined}
    },
    {
        headers: {
            color: undefined,
            backgroundColor: '#9B9B9D'
        }, 
        rows: {even: {color: ROW_TEXT_COLOR_DEFAULT, backgroundColor: undefined}, odd: {color: ROW_TEXT_COLOR_DEFAULT, backgroundColor: undefined}},
        border: {borderStyle: undefined, borderColor: undefined}
    },
    {
        headers: {
            color: '#FFFFFF',
            backgroundColor: '#549D3A'
        }, 
        rows: {even: {color: DARK_TEXT_COLOR, backgroundColor: '#D0E3C9'}, odd: {color: DARK_TEXT_COLOR, backgroundColor: '#FFFFFF'}},
        border: {borderStyle: undefined, borderColor: undefined}
    },
    {
        headers: {
            color: '#FFFFFF',
            backgroundColor: '#4D73BE'
        }, 
        rows: {even: {color: DARK_TEXT_COLOR, backgroundColor: '#DAE1F0'}, odd: {color: DARK_TEXT_COLOR, backgroundColor: '#FFFFFF'}},
        border: {borderStyle: undefined, borderColor: undefined}
    },
    {
        headers: {
            color: '#FFFFFF',
            backgroundColor: '#8F1B15'
        }, 
        rows: {even: {color: DARK_TEXT_COLOR, backgroundColor: '#F0DADA'}, odd: {color: DARK_TEXT_COLOR, backgroundColor: '#FFFFFF'}},
        border: {borderStyle: undefined, borderColor: undefined}
    }
]


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
                {DEFAULT_SUGGESTED_STYLES.map((suggestedStyle, index) => {
                    const headerColor = suggestedStyle.headers?.backgroundColor || 'var(--mito-background-highlight)';
                    const evenRowColor = suggestedStyle.rows?.even?.backgroundColor || 'var(--mito-background)';
                    const oddRowColor = suggestedStyle.rows?.odd?.backgroundColor || 'var(--mito-background-off)';

                    return (
                        <div 
                            key={index}
                            onClick={() => {
                                // Just clearing out the data sets it to the default
                                props.updateDataframeFormatParams(suggestedStyle);
                            }}
                            className='mito-suggested-style'
                        >
                            <SuggestedStyleIcon
                                headerColor={headerColor}
                                evenRowColor={evenRowColor}
                                oddRowColor={oddRowColor}
                            />
                        </div>
                    )
                })}
            </Row>
        </>
    )
}

export default SuggestedStyles;