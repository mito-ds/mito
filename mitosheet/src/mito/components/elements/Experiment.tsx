/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { AnalysisData, ExperimentID } from "../../types";
import { isExperimentActive, isVariantA } from "../../utils/experiments";


/**
 * This component is used to render a different component depending
 * what experiment is active.
 */
const Experiment = (props: {
    analysisData: AnalysisData, 
    experimentID: ExperimentID,
    aElement: React.ReactNode,
    bElement: React.ReactNode,
}): JSX.Element => {

    // If we are not running this experiment, then we simply default to the aElement
    if (!isExperimentActive(props.analysisData, props.experimentID)) {
        return <>{props.aElement}</>;
    } else {
        if (isVariantA(props.analysisData)) {
            return <>{props.aElement}</>;
        } else {
            return <>{props.bElement}</>;
        }
    }
}

export default Experiment;