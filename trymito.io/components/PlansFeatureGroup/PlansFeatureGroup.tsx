import { Feature, PlanType } from "../../pages/plans"
import PlansFeatureRow from "./PlansFeatureRow"

const PlansFeatureGroup = (props: {
    sectionTitle: string,
    mobilePlanDisplayed?: PlanType
    features: Feature[],
}): JSX.Element => {
    const mobilePlanDisplayed = props.mobilePlanDisplayed;

    if (mobilePlanDisplayed !== undefined) {
        return (
            <>
                <PlansFeatureRow
                    isHeader
                    rowLabel={props.sectionTitle} 
                    featureRowContent={[mobilePlanDisplayed]}
                />
                {props.features.map((f, idx) => {
                    return (
                    <PlansFeatureRow
                        key={idx}
                        rowLabel={f.feature} 
                        featureRowContent={[f.planSupport[mobilePlanDisplayed]]}
                        lastFeature={idx == props.features.length - 1}
                    />
                    )
                })}
            </>
        )
    } else {
        return (
            <>
                <PlansFeatureRow
                    isHeader
                    rowLabel={props.sectionTitle} 
                    featureRowContent={['Open Source', 'Pro', 'Enterprise']}
                />
                {props.features.map((f, idx) => {
                    return (
                    <PlansFeatureRow
                        key={idx}
                        rowLabel={f.feature} 
                        featureRowContent={[f.planSupport['Open Source'], f.planSupport['Pro'], f.planSupport['Enterprise']]}
                        lastFeature={idx == props.features.length - 1}
                    />
                    )
                })}
            </>
        )
    }
}

export default PlansFeatureGroup; 