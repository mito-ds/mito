import Link from 'next/link';
import TextButton from '../TextButton/TextButton';
import styles from './CalendarDay.module.css'

const CalendarDay = (props: {children: JSX.Element[]}): JSX.Element => {

    return (
        <div className={styles.calendar_day_card}> 
            {props.children}
        </div>
    )
}

export default CalendarDay;