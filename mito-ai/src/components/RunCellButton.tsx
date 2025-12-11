/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useRef, useEffect } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { NotebookActions } from '@jupyterlab/notebook';
import PlayButtonIcon from '../icons/PlayButtonIcon';
import ChevronIcon from '../icons/ChevronIcon';
import RunAllIcon from '../icons/RunAllIcon';
import RestartAndRunIcon from '../icons/RestartAndRunIcon';
import SimplePlayIcon from '../icons/SimplePlayIcon';
import RestartIcon from '../icons/RestartIcon';
import StopIcon from '../icons/StopIcon';
import ClearIcon from '../icons/ClearIcon';

interface RunCellButtonProps {
  app: JupyterFrontEnd;
  notebookTracker: INotebookTracker;
}

const RunCellButton: React.FC<RunCellButtonProps> = ({ app, notebookTracker }) => {
  const getCurrentNotebook = () => {
    return notebookTracker.currentWidget;
  };

  const handleRunCurrentCell = (): void => {
    const current = getCurrentNotebook();
    if (current) {
      const notebook = current.content;
      const sessionContext = current.context?.sessionContext;
      void NotebookActions.run(notebook, sessionContext);
    }
  };

  const handleRunAllCells = (): void => {
    const current = getCurrentNotebook();
    if (current) {
      const notebook = current.content;
      const sessionContext = current.context?.sessionContext;
      void NotebookActions.runAll(notebook, sessionContext);
    }
  };

  const handleRestart = async (): Promise<void> => {
    const current = getCurrentNotebook();
    if (current) {
      await app.commands.execute('notebook:restart-kernel');
    }
  };

  const handleRestartAndRunAll = async (): Promise<void> => {
    const current = getCurrentNotebook();
    if (current) {
      await app.commands.execute('notebook:restart-and-run-all');
    }
  };

  const handleStop = (): void => {
    const current = getCurrentNotebook();
    if (current) {
      void app.commands.execute('notebook:interrupt-kernel');
    }
  };

  const handleClearAllOutputs = (): void => {
    const current = getCurrentNotebook();
    if (current) {
      const notebook = current.content;
      NotebookActions.clearAllOutputs(notebook);
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isDropdownOpen]);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const buttonWidth = rect.width;
    
    // If click is in the right 30% of the button (chevron area), open dropdown
    // Otherwise, run all cells (main action)
    if (clickX > buttonWidth * 0.7) {
      e.preventDefault();
      e.stopPropagation();
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      // Click on main button area - run all cells
      handleRunAllCells();
    }
  };

  const menuSections = [
    {
      title: 'Run Code',
      items: [
        {
          label: 'Run Current Cell',
          icon: SimplePlayIcon,
          onClick: () => {
            handleRunCurrentCell();
            setIsDropdownOpen(false);
          }
        },
        {
          label: 'Run All Cells',
          icon: RunAllIcon,
          onClick: () => {
            handleRunAllCells();
            setIsDropdownOpen(false);
          }
        },
        {
          label: 'Restart and Run All',
          icon: RestartAndRunIcon,
          onClick: () => {
            void handleRestartAndRunAll();
            setIsDropdownOpen(false);
          }
        }
      ]
    },
    {
      title: 'Kernel',
      items: [
        {
          label: 'Restart',
          icon: RestartIcon,
          onClick: () => {
            void handleRestart();
            setIsDropdownOpen(false);
          }
        },
        {
          label: 'Stop',
          icon: StopIcon,
          onClick: () => {
            handleStop();
            setIsDropdownOpen(false);
          }
        }
      ]
    },
    {
      title: 'Notebook',
      items: [
        {
          label: 'Clear All Outputs',
          icon: ClearIcon,
          onClick: () => {
            handleClearAllOutputs();
            setIsDropdownOpen(false);
          }
        }
      ]
    }
  ];

  const trigger = (
    <div className="mito-run-cell-button-container" ref={dropdownRef}>
      <button
        className="mito-run-cell-button"
        onClick={handleButtonClick}
        title="Run all"
      >
        <span className="mito-run-cell-button-content">
          <PlayButtonIcon />
          <span className="mito-run-cell-button-text">Run all</span>
          <span className="mito-run-cell-button-separator"></span>
          <span className="mito-run-cell-button-chevron">
            <ChevronIcon direction="down" />
          </span>
        </span>
      </button>
      {isDropdownOpen && (
        <div className="mito-run-cell-dropdown-menu">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mito-run-cell-dropdown-section">
              {sectionIndex > 0 && <div className="mito-run-cell-dropdown-separator" />}
              <div className="mito-run-cell-dropdown-section-header">
                {section.title}
              </div>
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  className="mito-run-cell-dropdown-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.onClick();
                  }}
                >
                  <span className="mito-run-cell-dropdown-item-icon">
                    {item.icon && React.createElement(item.icon)}
                  </span>
                  <span className="mito-run-cell-dropdown-item-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return trigger;
};

export default RunCellButton;

