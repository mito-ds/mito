import { AnalysisData, ExperimentID } from "../types";

export const isExperimentActive = (analysisData: AnalysisData, experimentID: ExperimentID) => {
    return analysisData.experiment?.experiment_id === experimentID;
}

export const isVariantA = (analysisData: AnalysisData): boolean => {
    return analysisData.experiment?.variant === 'A';
}

export const isVariantB = (analysisData: AnalysisData): boolean => {
    return  analysisData.experiment?.variant === 'B';
}