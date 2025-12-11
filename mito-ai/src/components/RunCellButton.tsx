/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useRef, useEffect } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { KernelMessage, Kernel } from '@jupyterlab/services';
import type { ISessionContext } from '@jupyterlab/apputils';
import ChevronIcon from '../icons/ChevronIcon';
import RunAllIcon from '../icons/RunAllIcon';
import RestartAndRunIcon from '../icons/RestartAndRunIcon';
import SimplePlayIcon from '../icons/SimplePlayIcon';
import RestartIcon from '../icons/RestartIcon';
import StopIcon from '../icons/StopIcon';
import ClearIcon from '../icons/ClearIcon';
import LoadingCircle from './LoadingCircle';

interface RunCellButtonProps {
  app: JupyterFrontEnd;
  notebookPanel: NotebookPanel;
}

const RunCellButton: React.FC<RunCellButtonProps> = ({ app, notebookPanel }) => {

  const handleRunCurrentCell = (): void => {
    const notebook = notebookPanel.content;
    const sessionContext = notebookPanel.context?.sessionContext;
    void NotebookActions.run(notebook, sessionContext);
  };

  const handleRunAllCells = (): void => {
    const notebook = notebookPanel.content;
    const sessionContext = notebookPanel.context?.sessionContext;
    void NotebookActions.runAll(notebook, sessionContext);
  };

  const handleRestart = async (): Promise<void> => {
    const sessionContext = notebookPanel.context?.sessionContext;
    if (sessionContext) {
      await sessionContext.restartKernel();
    }
  };

  const handleRestartAndRunAll = async (): Promise<void> => {
    // First restart, then run all
    const sessionContext = notebookPanel.context?.sessionContext;
    if (sessionContext) {
      await sessionContext.restartKernel();
      // Wait a bit for kernel to restart, then run all
      const notebook = notebookPanel.content;
      setTimeout(() => {
        void NotebookActions.runAll(notebook, sessionContext);
      }, 1000);
    }
  };

  const handleStop = (): void => {
    const sessionContext = notebookPanel.context?.sessionContext;
    const kernel = sessionContext?.session?.kernel;
    if (kernel) {
      void kernel.interrupt();
    }
  };

  const handleClearAllOutputs = (): void => {
    const notebook = notebookPanel.content;
    NotebookActions.clearAllOutputs(notebook);
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const executionCountRef = useRef<number>(0);

  // Track execution state for this specific notebook panel
  useEffect(() => {
    const sessionContext = notebookPanel.context?.sessionContext;
    if (!sessionContext) {
      setIsRunning(false);
      return;
    }

    // Listen to iopub messages to track execution
    const handleIOPubMessage = (sender: ISessionContext, msg: KernelMessage.IMessage): void => {
      const msgType = msg.header.msg_type;
      
      // When a cell starts executing
      if (msgType === 'execute_input') {
        executionCountRef.current += 1;
        setIsRunning(true);
        setIsDropdownOpen(false); // Close dropdown when execution starts
      }
      
      // When a cell finishes executing
      if (msgType === 'execute_reply') {
        executionCountRef.current = Math.max(0, executionCountRef.current - 1);
        // Only set to not running if no cells are executing
        if (executionCountRef.current === 0) {
          setIsRunning(false);
        }
      }
    };

    // Listen to kernel status changes - this is the primary way to detect completion
    const handleStatusChange = (sender: ISessionContext, status: Kernel.Status): void => {
      // When kernel becomes idle, execution has finished - reset to "Run all" state
      if (status === 'idle') {
        executionCountRef.current = 0;
        setIsRunning(false);
      }
    };

    // Handle kernel disconnection
    const handleKernelChange = (): void => {
      const kernel = sessionContext.session?.kernel;
      if (!kernel) {
        executionCountRef.current = 0;
        setIsRunning(false);
      }
    };

    sessionContext.iopubMessage.connect(handleIOPubMessage);
    sessionContext.statusChanged.connect(handleStatusChange);
    sessionContext.kernelChanged.connect(handleKernelChange);

    return () => {
      sessionContext.iopubMessage.disconnect(handleIOPubMessage);
      sessionContext.statusChanged.disconnect(handleStatusChange);
      sessionContext.kernelChanged.disconnect(handleKernelChange);
    };
  }, [notebookPanel]);

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

  const handleMainButtonClick = (): void => {
    // When running, clicking opens the dropdown (so user can Stop)
    if (isRunning) {
      setIsDropdownOpen(!isDropdownOpen);
      return;
    }
    // Otherwise, run the current cell
    handleRunCurrentCell();
  };

  const handleDropdownButtonClick = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
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
      <div className={`mito-run-cell-button-group ${isRunning ? 'mito-run-cell-button-running' : ''}`}>
        <button
          className="mito-run-cell-button mito-run-cell-button-main"
          onClick={handleMainButtonClick}
          title={isRunning ? "Running Cells - Click to stop" : "Run Active Cell"}
        >
          {isRunning ? (
            <>
              <LoadingCircle />
              <span className="mito-run-cell-button-text">Running Cells</span>
            </>
          ) : (
            <>
              <SimplePlayIcon />
              <span className="mito-run-cell-button-text">Run Active Cell</span>
            </>
          )}
        </button>
        <span className="mito-run-cell-button-divider"></span>
        <button
          className="mito-run-cell-button mito-run-cell-button-dropdown"
          onClick={handleDropdownButtonClick}
          title="More actions"
        >
          <ChevronIcon direction="down" />
        </button>
      </div>
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

