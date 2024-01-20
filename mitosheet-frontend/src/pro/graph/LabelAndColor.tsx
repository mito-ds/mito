import React from "react";
import ColorInput from "../../components/elements/ColorInput";
import Col from "../../components/layout/Col";
import Row from "../../components/layout/Row";

interface LabelAndColorProps {
    label: string,
    color: string,
    onChange: (newColor: string) => void;

}


/* 
    A Pro element to be used in graph styling to allow
    users to select the color of a certain element of
    the graph
*/
const LabelAndColor = (props: LabelAndColorProps): JSX.Element => {
    return (
        <Row justify='space-between' align='center'>
            <Col>
                <p>
                    {props.label}
                </p>
            </Col>
            <ColorInput 
                value={props.color} 
                onChange={props.onChange}     
            />
        </Row>
    )
}

export default LabelAndColor;