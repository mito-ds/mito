import React, { useState, useRef, useEffect } from 'react';
import '../../style/DropdownMenu.css';

interface DropdownMenuItem {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ fill?: string }>;
}

interface DropdownMenuProps {
    trigger: React.ReactNode;
    items: DropdownMenuItem[];
    className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (onClick: () => void) => {
        onClick();
        setIsOpen(false);
    };

    return (
        <div className={`dropdown-container ${className}`} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>
            {isOpen && (
                <div className="dropdown-menu">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            className={`dropdown-item ${item.icon ? 'dropdown-item-with-icon' : ''}`}
                            onClick={() => handleItemClick(item.onClick)}
                            style={{ display: 'flex', gap: '5px' }}
                        >
                            {item.icon && (
                                <span className="dropdown-item-icon" style={{ width: '20px', display: 'flex' }}>
                                    {React.createElement(item.icon )}
                                </span>
                            )}
                            <span className="dropdown-item-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;