import React from "react";
import { UserDefinedFunction } from "../../../types";
import CollapsibleSection from "../../layout/CollapsibleSection";
import Spacer from "../../layout/Spacer";

const UserDefinedFunctionDocumentationSection = (props: {
    userDefinedFunction: UserDefinedFunction,
}): JSX.Element => {

    const hasDocString = props.userDefinedFunction.docstring !== undefined && props.userDefinedFunction.docstring !== null && props.userDefinedFunction.docstring !== '';

    if (!hasDocString) {
        return <></>;
    }

    return (
        <>
            <CollapsibleSection title='Documentation'>
                <p>
                    {props.userDefinedFunction.docstring}
                </p>
                {props.userDefinedFunction.domain !== undefined && props.userDefinedFunction.domain !== null &&
                    <p>
                        Domain: {props.userDefinedFunction.domain}
                    </p>
                }
            </CollapsibleSection>
            <Spacer px={10} />
        </>
    )
}

export default UserDefinedFunctionDocumentationSection;

