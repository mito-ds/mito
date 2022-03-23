import React from "react";
import ColorInput from "../../components/elements/ColorInput";
import Col from "../../components/spacing/Col";
import Row from "../../components/spacing/Row";

interface LabelAndColorProps {
    label: string,
    color: string,
    onChange: (newColor: string) => void;

}


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