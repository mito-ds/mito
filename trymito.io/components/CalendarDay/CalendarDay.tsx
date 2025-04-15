/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import styles from './CalendarDay.module.css'

const CalendarDay = (props: {children: JSX.Element[]}): JSX.Element => {

    return (
        <div className={styles.calendar_day_card}> 
            {props.children}
        </div>
    )
}

export default CalendarDay;