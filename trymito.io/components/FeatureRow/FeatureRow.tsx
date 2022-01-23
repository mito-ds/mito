import Image from 'next/image'

import featureRowStyles from './FeatureRow.module.css'

import FeatureIncludedDot from '../../public/FeatureIncludedDot.png'
import FeatureNotIncludedDot from '../../public/FeatureNotIncludedDot.png'


const FeatureRow = (props: {
    isHeader?: boolean,
    rowLabel: string, 
    featureRowContent: (boolean | string)[], 
    lastFeature?: boolean
}): JSX.Element => {
    const displayBottomBorderClass = props.lastFeature ? '' : featureRowStyles.display_bottom_border
 
    if (props.isHeader) {
        return (
            <div className={featureRowStyles.feature_row_container + ' ' + displayBottomBorderClass + ' ' + featureRowStyles.section_header}> 
                <p className={featureRowStyles.row_label}>
                    {props.rowLabel}
                </p>
                {props.featureRowContent.map((frc, idx) => {
                    return (
                        <p className={featureRowStyles.feature_row_content} key={idx}>
                            {frc}
                        </p>
                    )
                })} 
            </div>
        )
    } else {
        return (
            <div className={featureRowStyles.feature_row_container + ' ' + displayBottomBorderClass}> 
                <p className={featureRowStyles.row_label}>
                    {props.rowLabel}
                </p>
                {props.featureRowContent.map((frc, idx) => {

                    if (typeof frc === 'boolean') {
                        const imageSrc = frc ? FeatureIncludedDot : FeatureNotIncludedDot
                        const imageAlt = frc ? 'feature included' : 'feature not included'

                        return (
                            <div className={featureRowStyles.feature_row_content} key={idx}>
                                <Image
                                    src={imageSrc}
                                    alt={imageAlt}
                                    width={15}
                                    height={15}
                                />
                            </div>
                        )
                    } else {
                        return (
                            <div className={featureRowStyles.feature_row_content} key={idx}>
                                <p>
                                    {frc}
                                </p>
                            </div>
                            
                        )
                    }
                    // TODO: handle if a boolean
                    
                })} 
            </div>
        )
    }
}

export default FeatureRow; 