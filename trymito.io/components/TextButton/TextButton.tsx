import { classNames } from '../../utils/classNames';
import textButtonStyles from './TextButton.module.css'

const TextButton = (props : {
    text: string,
    onClick?: () => void;
    href?: string
    action?: string
    variant?: 'white'
    fontSize?: 'small'
    buttonSize?: 'small'
}): JSX.Element => {

    const colorStyle = props.variant === 'white' ? textButtonStyles.white : textButtonStyles.purple;
    const fontStyle = props.fontSize === 'small' ? textButtonStyles.small : textButtonStyles.large;
    const widthStyle = props.buttonSize === 'small' ? textButtonStyles.button_size_small : undefined

    if (props.action === undefined) {
        return (
            <a 
                className={classNames(textButtonStyles.text_button, colorStyle, fontStyle, widthStyle)} 
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
                <button className={classNames(textButtonStyles.text_button, colorStyle, fontStyle, widthStyle)} type="submit">
                    {props.text}
                </button>
            </form>
        )
    }
    
}

export default TextButton;