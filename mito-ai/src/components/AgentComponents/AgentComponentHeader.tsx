import React from 'react';
import { classNames } from '../../utils/classNames';

interface AgentComponentHeaderProps {
    icon: React.ReactNode;
    text: string;
    onClick: () => void;
    isExpanded: boolean;
    displayBorder?: boolean;
    className?: string;
}

const AgentComponentHeader: React.FC<AgentComponentHeaderProps> = ({
    icon,
    text,
    onClick,
    isExpanded,
    displayBorder = true,
    className
}) => {
    return (
        <div
            onClick={onClick}
            className={classNames('agent-component-header', {
                expanded: isExpanded,
                'no-border': !displayBorder
            }, className)}
        >
            <span className="agent-component-header-content">
                {icon}
                {text}
            </span>
            <svg
                className={classNames('agent-component-header-expand-icon', {
                    expanded: isExpanded
                })}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M6 12L10 8L6 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={isExpanded ? 'rotate(90 8 8)' : 'rotate(0 8 8)'}
                />
            </svg>
        </div>
    );
};

export default AgentComponentHeader; 