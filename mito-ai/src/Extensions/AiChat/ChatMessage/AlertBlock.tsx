import React, { useEffect, useState } from 'react';
import ErrorIcon from '../../../icons/ErrorIcon';


interface IAlertBlockProps {
    content: string;
    mitoAIConnectionErrorType: string | null;
}

const AlertBlock: React.FC<IAlertBlockProps> = ({ content, mitoAIConnectionErrorType }) => {
    const [message, setMessage] = useState<string | JSX.Element>("");

    useEffect(() => {
        if (mitoAIConnectionErrorType === "mito_server_free_tier_limit_reached") {
            const message = (
                <p>
                    You've reached the free tier limit for Mito AI. <a href="https://www.trymito.io/plans" target="_blank">Upgrade to Pro for unlimited uses</a> or supply your own OpenAI API key.
                </p>
            );
            setMessage(message);
        }
        else {
            setMessage(content);
        }
    }, [content]);

    return (
        <div className="chat-message-alert">
            <span style={{ marginRight: '4px' }}><ErrorIcon /></span>
            {message}
        </div>
    );
};

export default AlertBlock;