


export type ChecklistID = 
    | 'onboarding_checklist'


export const CHECKLIST_STEPS: Record<ChecklistID, string[]> = {
    "onboarding_checklist": ['signup', 'import', 'filter', 'pivot', 'graph', 'finalize']
}