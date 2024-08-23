import React from 'react';

interface ICodeProps {
    code: string
}

const Code: React.FC<ICodeProps> = ({code}) => {

    return (
    
        <code>
            {code}
        </code>
    )

}

export default Code