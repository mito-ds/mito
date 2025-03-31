/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Image from 'next/image'

import iconAndTextRowStyles from './IconAndTextRow.module.css'
import { classNames } from '../../utils/classNames'

const IconAndTextRow = (props: {
    title: string, 
    shortTitle?: string
    imageSrc: string
}): JSX.Element => {

    return (
        <div className={classNames(iconAndTextRowStyles.container)}>
            <Image
                src={props.imageSrc}
                alt={props.title}
                width={20}
                height={20}
            />
            <p className={iconAndTextRowStyles.title_text}>
                {props.title}
            </p>
        </div>
    )
    
}

export default IconAndTextRow; 