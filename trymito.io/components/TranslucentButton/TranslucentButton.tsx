
import Link from 'next/link';
import translucentButtonStyles from './TranslucentButton.module.css'
import { classNames } from '../../utils/classNames';

const TranslucentButton = (props: {
    children: JSX.Element;
    href?: string;
    onClick?: () => void
    className?: string
}): JSX.Element => {

    if (props.href !== undefined) {
        return (
            <a 
                className={classNames(props.className, translucentButtonStyles.translucent_button)}
                href={props.href}
                target="_blank"
                rel="noreferrer"
            >
                {props.children}
            </a>
        )
    } else {
        return (
            <button 
                className={classNames(props.className, translucentButtonStyles.translucent_button)}
                onClick={props.onClick}
            >
                {props.children}
            </button>
    
        )
    }
}



export default TranslucentButton;