/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useRef, useEffect } from 'react';
import '../../style/DropdownMenu.css';
import { LabIcon } from '@jupyterlab/ui-components';

interface DropdownSecondaryAction {
  icon: LabIcon.IReact;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
}

interface DropdownMenuItem {
  label: string;
  onClick: () => void; // main action
  primaryIcon?: LabIcon.IReact;
  disabled?: boolean;
  disabledTooltip?: string;
  secondaryActions?: DropdownSecondaryAction[];
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  className?: string;
  alignment?: 'left' | 'right';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  className = '',
  alignment = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle the main click (primary action)
  const handlePrimaryClick = (onClick: () => void, disabled?: boolean): void => {
    if (disabled) return;
    onClick();
    setIsOpen(false);
  };

  // Choose the alignment class
  const alignmentClass =
    alignment === 'right' ? 'dropdown-menu-right' : 'dropdown-menu-left';

    return (
        <div className={`dropdown-container ${className}`} ref={dropdownRef}>
          <div onClick={() => setIsOpen(!isOpen)}>
            {trigger}
          </div>
          {isOpen && (
            <div className={`dropdown-menu ${alignmentClass}`}>
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`dropdown-item-row ${item.disabled ? 'dropdown-item-disabled' : ''}`}
                >

                  <button
                    className="dropdown-item-main"
                    onClick={() => handlePrimaryClick(item.onClick, item.disabled)}
                    disabled={item.disabled}
                    title={item.disabled ? item.disabledTooltip : item.label}
                  >
                    {/* Optional primary icon on the left */}
                    <span className="dropdown-item-icon">
                        {item.primaryIcon && React.createElement(item.primaryIcon)}
                    </span>
                    <span className="dropdown-item-label">{item.label}</span>
                  </button>
                  {item.secondaryActions && item.secondaryActions.map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      className="dropdown-item-secondary"
                      onClick={(e) => {
                        e.stopPropagation();  // prevent triggering the main onClick
                        if (!action.disabled) {
                          action.onClick();
                          setIsOpen(false); // optional: close the dropdown after secondary action
                        }
                      }}
                      disabled={action.disabled}
                      title={action.tooltip}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: action.disabled ? 'default' : 'pointer',
                        padding: 0,
                      }}
                    >
                      {React.createElement(action.icon, { fill: 'currentColor' })}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      );
};

export default DropdownMenu;