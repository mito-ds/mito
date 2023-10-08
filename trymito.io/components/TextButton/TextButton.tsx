import { classNames } from '../../utils/classNames';
import textButtonStyles from './TextButton.module.css'

const TextButton = (props : {
    text: string,
    onClick?: () => void;
    href?: string
    action?: string
    variant?: 'white'
}): JSX.Element => {

    const colorStyle = props.variant === 'white' ? textButtonStyles.white : textButtonStyles.purple;
    if (props.action === undefined) {
        return (
            <a 
                className={classNames(textButtonStyles.text_button, colorStyle)} 
                href={props.href}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => props.onClick !== undefined ? props.onClick() : undefined}
            >
                {props.text}
            </a>
        )
    } else {
        return (
            <form action={props.action} method="POST" target="_blank">
                <button className={classNames(textButtonStyles.text_button, colorStyle)} type="submit">
                    {props.text}
                </button>
            </form>
        )
    }
    
}

export default TextButton;