import styles from './CalendarDay.module.css'

const CalendarDay = (props: {children: JSX.Element[]}): JSX.Element => {

    return (
        <div className={styles.calendar_day_card}> 
            {props.children}
        </div>
    )
}

export default CalendarDay;