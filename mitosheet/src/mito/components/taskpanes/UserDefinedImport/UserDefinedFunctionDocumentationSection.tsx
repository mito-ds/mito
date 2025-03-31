/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { UserDefinedFunction } from "../../../types";
import CollapsibleSection from "../../layout/CollapsibleSection";
import Spacer from "../../layout/Spacer";

const UserDefinedFunctionDocumentationSection = (props: {
    userDefinedFunction: UserDefinedFunction,
}): JSX.Element => {

    return (
        <>
            <CollapsibleSection title='Importer Documentation'>
                <p className="text-subtext-1">
                    <span className="text-bold">Function Name:</span> {props.userDefinedFunction.name}
                </p>
                {props.userDefinedFunction.docstring !== undefined && props.userDefinedFunction.docstring !== null && props.userDefinedFunction.docstring !== '' &&
                    <>
                        <Spacer px={5}/>
                        <p className="text-subtext-1">
                            <span className="text-bold">Description:</span> {props.userDefinedFunction.docstring}
                        </p>
                    </>
                }
                {props.userDefinedFunction.domain !== undefined && props.userDefinedFunction.domain !== null &&
                    <>
                        <Spacer px={5}/>
                        <p className="text-subtext-1">
                            <span className="text-bold">Domain:</span>  {props.userDefinedFunction.domain}
                        </p>
                    </>
                }
            </CollapsibleSection>
            <Spacer px={10} />
        </>
    )
}

export default UserDefinedFunctionDocumentationSection;

