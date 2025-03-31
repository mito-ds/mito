/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Image from 'next/image'

import plansFeatureRowStyles from './PlansFeatureRow.module.css'

import FeatureIncludedDot from '../../public/FeatureIncludedDot.png'
import FeatureNotIncludedDot from '../../public/FeatureNotIncludedDot.png'


const PlansFeatureRow = (props: {
    isHeader?: boolean,
    rowLabel: string, 
    featureRowContent: (boolean | string)[], 
    lastFeature?: boolean
}): JSX.Element => {
    const displayBottomBorderClass = props.lastFeature ? '' : plansFeatureRowStyles.display_bottom_border
 
    if (props.isHeader) {
        return (
            <div className={plansFeatureRowStyles.feature_row_container + ' ' + displayBottomBorderClass + ' ' + plansFeatureRowStyles.section_header}> 
                <p className={plansFeatureRowStyles.row_label}>
                    {props.rowLabel}
                </p>
                {props.featureRowContent.map((frc, idx) => {
                    return (
                        <p className={plansFeatureRowStyles.feature_row_content} key={idx}>
                            {frc}
                        </p>
                    )
                })} 
            </div>
        )
    } else {
        return (
            <div className={plansFeatureRowStyles.feature_row_container + ' ' + displayBottomBorderClass}> 
                <p className={plansFeatureRowStyles.row_label}>
                    {props.rowLabel}
                </p>
                {props.featureRowContent.map((frc, idx) => {

                    if (typeof frc === 'boolean') {
                        const imageSrc = frc ? FeatureIncludedDot : FeatureNotIncludedDot
                        const imageAlt = frc ? 'feature included' : 'feature not included'

                        return (
                            <div className={plansFeatureRowStyles.feature_row_content} key={idx}>
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
                            <div className={plansFeatureRowStyles.feature_row_content} key={idx}>
                                <p>
                                    {frc}
                                </p>
                            </div>
                            
                        )
                    }                    
                })} 
            </div>
        )
    }
}

export default PlansFeatureRow; 