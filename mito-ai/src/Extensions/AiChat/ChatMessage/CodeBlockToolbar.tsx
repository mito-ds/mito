/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import copyToClipboard from '../../../utils/copyToClipboard';
import IconButton from '../../../components/IconButton';
import CopyIcon from '../../../icons/CopyIcon';
import PlayButtonIcon from '../../../icons/PlayButtonIcon';
import { CodeReviewStatus } from '../ChatTaskpane';
import AcceptIcon from '../../../icons/AcceptIcon';
import RejectIcon from '../../../icons/RejectIcon';

interface ICodeBlockToolbarProps {
    code: string;
    isLastAiMessage?: boolean;
    codeReviewStatus?: CodeReviewStatus;
    onPreview?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
}

const CodeBlockToolbar: React.FC<ICodeBlockToolbarProps> = ({
    code,
    isLastAiMessage = false,
    codeReviewStatus,
    onPreview,
    onAccept,
    onReject
}) => {
    return (
        <div className='code-block-toolbar'>
            {isLastAiMessage && codeReviewStatus === 'chatPreview' && onPreview && (
                <IconButton
                    icon={<PlayButtonIcon />}
                    title="Overwrite Active Cell"
                    onClick={onPreview}
                />
            )}
            {isLastAiMessage && codeReviewStatus === 'codeCellPreview' && onAccept && onReject && (
                <>
                    <IconButton
                        icon={<AcceptIcon />}
                        title="Accept AI Generated Code"
                        onClick={onAccept}
                        style={{ color: 'var(--green-700)' }}
                    />
                    <IconButton
                        icon={<RejectIcon />}
                        title="Reject AI Generated Code"
                        onClick={onReject}
                        style={{ color: 'var(--red-700)' }}
                    />
                </>
            )}
            {(!isLastAiMessage || codeReviewStatus !== 'codeCellPreview') && (
                <IconButton
                    icon={<CopyIcon />}
                    title="Copy"
                    onClick={() => { void copyToClipboard(code) }}
                />
            )}
        </div>
    );
};

export default CodeBlockToolbar; 