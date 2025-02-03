import React from 'react';
import TextButton from '../../../components/TextButton';


interface IAlertBlockProps {
    content: string;
    mitoAIConnectionErrorType: string | null;
}



const AlertBlock: React.FC<IAlertBlockProps> = ({ content, mitoAIConnectionErrorType }) => {

    if (mitoAIConnectionErrorType === "mito_server_free_tier_limit_reached") {
        return (
            <div className="chat-message-alert">
                <p>
                    Your Mito AI free trial has ended. To continue using Mito AI, upgrade to <a href="https://www.trymito.io/plans" target="_blank">Mito Pro</a> and get access to:
                </p>
                <ul>
                    <li>Unlimited AI Completions</li>
                    <li>All Mito Spreadsheet Pro features</li>
                </ul>
                <p>
                    Or supply your own Open AI Key to continue using the basic version of Mito AI. 
                </p>
                <TextButton
                    title="Upgrade to Pro"
                    text="Upgrade to Pro"
                    onClick={() => {
                        window.open("https://www.trymito.io/plans", '_blank');
                    }}
                    variant="purple"
                    width="block"
                />
            </div>
        );
    }

    return (
        <div className="chat-message-alert">
            {content}
        </div>
    );
};

export default AlertBlock;