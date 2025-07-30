/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import TextButton from '../../../components/TextButton';

interface RevertQuestionnaireProps {
    onDestroy: () => void;
}

const RevertQuestionnaire: React.FC<RevertQuestionnaireProps> = ({ onDestroy }) => {
    const CHOICES = [
        'placeholder option 1',
        'placeholder option 2',
        'placeholder option 3',
        'placeholder option 4'
    ]

    const handleButtonClick = (choice: string) => {
        console.log('Selected choice:', choice);
        // Add your logic here for handling the button click
        onDestroy(); // Destroy the component when any button is clicked
    };

    return (
        <div>
            <p>What went wrong?</p>
            {CHOICES.map((choice) => (
                <>
                    <TextButton
                        text={choice}
                        onClick={() => handleButtonClick(choice)}
                        title={choice}
                        variant='purple'
                        width='block'
                        textAlign='left'
                    />
                    <br />
                </>
            ))}
        </div>
    );
};

export default RevertQuestionnaire;