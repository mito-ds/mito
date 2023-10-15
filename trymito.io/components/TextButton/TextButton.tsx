import { classNames } from '../../utils/classNames';
import textButtonStyles from './TextButton.module.css'

const TextButton = (props : {
    text: string,
    onClick?: () => void;
    href?: string
    action?: string
    variant?: 'white'
    fontSize?: 'small'
}): JSX.Element => {

    const colorStyle = props.variant === 'white' ? textButtonStyles.white : textButtonStyles.purple;
    const fontStyle = props.fontSize === 'small' ? textButtonStyles.small : textButtonStyles.large;

    if (props.action === undefined) {
        return (
            <a 
                className={classNames(textButtonStyles.text_button, colorStyle, fontStyle)} 
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
                <button className={classNames(textButtonStyles.text_button, colorStyle, fontStyle)} type="submit">
                    {props.text}
                </button>
            </form>
        )
    }
    
}

export default TextButton;