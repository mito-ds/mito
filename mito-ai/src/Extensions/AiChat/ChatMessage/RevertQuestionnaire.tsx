/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import TextButton from '../../../components/TextButton';


const RevertQuestionnaire: React.FC = () => {
    const CHOICES = [
        'placeholder option 1',
        'placeholder option 2',
        'placeholder option 3',
        'placeholder option 4'
    ]

    const handleButtonClick = (choice: string) => {
        console.log('Selected choice:', choice);
        // Add your logic here for handling the button click
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
                    variant='gray'
                    width='block'
                />
                <br />
                </>
            ))}
        </div>
    );
};

export default RevertQuestionnaire;