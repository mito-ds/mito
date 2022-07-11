import React from "react";
import { AnalysisData, ExperimentID } from "../../types";
import { isExperimentActive, isVariantA } from "../../utils/experiments";


const Experiment = (props: {
    analysisData: AnalysisData, 
    experimentID: ExperimentID,
    aElement: React.ReactNode,
    bElement: React.ReactNode,
}): JSX.Element => {
    console.log("Experiment", props.analysisData.experiment);

    // If we are not running this experiment, then we simply default to the aElement
    if (!isExperimentActive(props.analysisData, props.experimentID)) {
        console.log("HERE")
        return <>{props.aElement}</>;
    } else {
        if (isVariantA(props.analysisData)) {
            console.log("Is a element")
            return <>{props.aElement}</>;
        } else {
            console.log("Is b element")
            return <>{props.bElement}</>;
        }
    }
}

export default Experiment;