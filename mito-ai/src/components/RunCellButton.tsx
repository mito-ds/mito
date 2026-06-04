/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useRef, useEffect } from 'react';
import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { KernelMessage, Kernel } from '@jupyterlab/services';
import type { ISessionContext } from '@jupyterlab/apputils';
import { SessionContextDialogs } from '@jupyterlab/apputils';
import type { IChangedArgs } from '@jupyterlab/coreutils';
import ChevronIcon from '../icons/ChevronIcon';
import RunAllIcon from '../icons/RunAllIcon';
import RestartAndRunIcon from '../icons/RestartAndRunIcon';
import SimplePlayIcon from '../icons/SimplePlayIcon';
import RestartIcon from '../icons/RestartIcon';
import StopIcon from '../icons/StopIcon';
import ClearIcon from '../icons/ClearIcon';
import LoadingCircle from './LoadingCircle';
import { classNames } from '../utils/classNames';

interface RunCellButtonProps {
  notebookPanel: NotebookPanel;
}

interface IExecutionStatus {
  executionStatus: 'idle' | 'busy';
  kernelStatus: ISessionContext.KernelDisplayStatus;
  totalTime: number;
  scheduledCellIds: Set<string>;
  scheduledCellNumber: number;
  needReset: boolean;
}

const createInitialExecutionStatus = (): IExecutionStatus => ({
  executionStatus: 'idle',
  kernelStatus: 'idle',
  totalTime: 0,
  scheduledCellIds: new Set<string>(),
  scheduledCellNumber: 0,
  needReset: true
});

const kernelStatusLabels: Partial<Record<ISessionContext.KernelDisplayStatus, string>> = {
  busy: 'Busy',
  idle: 'Idle',
  starting: 'Starting',
  restarting: 'Restarting',
  initializing: 'Initializing',
  terminating: 'Terminating',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  unknown: 'Unknown'
};

const getKernelStatusLabel = (status: ISessionContext.KernelDisplayStatus): string => {
  return kernelStatusLabels[status] ?? status;
};

const RunCellButton: React.FC<RunCellButtonProps> = ({ notebookPanel }) => {

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
    if (!sessionContext) {
      return;
    }

    // Use SessionContextDialogs.restart() which handles the restart dialog
    // and waits for the kernel to be ready, matching Jupyter Lab core behavior
    const dialogs = new SessionContextDialogs();
    await dialogs.restart(sessionContext);
  };

  const handleRestartAndRunAll = async (): Promise<void> => {
    const sessionContext = notebookPanel.context?.sessionContext;
    if (!sessionContext) {
      return;
    }

    // Use SessionContextDialogs.restart() which handles the restart dialog
    // and waits for the kernel to be ready, matching Jupyter Lab core behavior
    const dialogs = new SessionContextDialogs();
    const restarted = await dialogs.restart(sessionContext);
    
    if (restarted) {
      const notebook = notebookPanel.content;
      void NotebookActions.runAll(notebook, sessionContext);
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
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<IExecutionStatus>(
    createInitialExecutionStatus
  );
  const isRunning =
    executionStatus.executionStatus === 'busy' || executionStatus.kernelStatus === 'busy';
  const dropdownRef = useRef<HTMLDivElement>(null);
  const executionStatusRef = useRef<IExecutionStatus>(createInitialExecutionStatus());
  const intervalRef = useRef<number>(0);
  const resetTimeoutRef = useRef<number>(0);
  const idleTimeoutRef = useRef<number>(0);

  // Track execution state for this specific notebook panel
  useEffect(() => {
    const sessionContext = notebookPanel.context?.sessionContext;
    if (!sessionContext) {
      setExecutionStatus(createInitialExecutionStatus());
      return;
    }

    const publishExecutionStatus = (): void => {
      setExecutionStatus({
        ...executionStatusRef.current,
        scheduledCellIds: new Set(executionStatusRef.current.scheduledCellIds)
      });
    };

    const clearTimer = (): void => {
      if (intervalRef.current !== 0) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = 0;
      }
    };

    const clearResetTimeout = (): void => {
      if (resetTimeoutRef.current !== 0) {
        window.clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = 0;
      }
    };

    const clearIdleTimeout = (): void => {
      if (idleTimeoutRef.current !== 0) {
        window.clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = 0;
      }
    };

    const resetExecutionStatus = (): void => {
      executionStatusRef.current = {
        ...executionStatusRef.current,
        executionStatus: 'idle',
        totalTime: 0,
        scheduledCellIds: new Set<string>(),
        scheduledCellNumber: 0,
        needReset: false
      };
      clearResetTimeout();
      clearIdleTimeout();
      clearTimer();
      publishExecutionStatus();
    };

    const scheduleSwitchToIdle = (): void => {
      clearIdleTimeout();
      idleTimeoutRef.current = window.setTimeout(() => {
        executionStatusRef.current = {
          ...executionStatusRef.current,
          executionStatus: 'idle'
        };
        clearTimer();
        publishExecutionStatus();
      }, 150);

      clearResetTimeout();
      resetTimeoutRef.current = window.setTimeout(() => {
        executionStatusRef.current = {
          ...executionStatusRef.current,
          needReset: true
        };
      }, 1000);
    };

    const handleScheduledCell = (messageId: string): void => {
      const state = executionStatusRef.current;
      if (state.scheduledCellIds.has(messageId)) {
        return;
      }

      if (state.needReset) {
        resetExecutionStatus();
      }

      executionStatusRef.current = {
        ...executionStatusRef.current,
        scheduledCellIds: new Set([...executionStatusRef.current.scheduledCellIds, messageId]),
        scheduledCellNumber: executionStatusRef.current.scheduledCellNumber + 1
      };
      publishExecutionStatus();
    };

    const handleExecutedCell = (messageId: string): void => {
      const state = executionStatusRef.current;
      if (!state.scheduledCellIds.has(messageId)) {
        return;
      }

      const scheduledCellIds = new Set(state.scheduledCellIds);
      scheduledCellIds.delete(messageId);
      executionStatusRef.current = {
        ...state,
        scheduledCellIds
      };

      if (scheduledCellIds.size === 0) {
        scheduleSwitchToIdle();
      }

      publishExecutionStatus();
    };

    const startTimer = (): void => {
      if (executionStatusRef.current.scheduledCellIds.size === 0) {
        resetExecutionStatus();
        return;
      }

      if (executionStatusRef.current.executionStatus === 'busy') {
        return;
      }

      clearResetTimeout();
      executionStatusRef.current = {
        ...executionStatusRef.current,
        executionStatus: 'busy'
      };
      setIsDropdownOpen(false);
      publishExecutionStatus();
      intervalRef.current = window.setInterval(() => {
        executionStatusRef.current = {
          ...executionStatusRef.current,
          totalTime: executionStatusRef.current.totalTime + 1
        };
        publishExecutionStatus();
      }, 1000);
    };

    const handleAnyMessage = (
      sender: Kernel.IKernelConnection,
      args: Kernel.IAnyMessageArgs
    ): void => {
      const message = args.msg;

      if (message.header.msg_type === 'execute_request') {
        handleScheduledCell(message.header.msg_id);
      } else if (
        KernelMessage.isStatusMsg(message) &&
        message.content.execution_state === 'idle'
      ) {
        const parentId = (message.parent_header as KernelMessage.IHeader).msg_id;
        handleExecutedCell(parentId);
      } else if (
        KernelMessage.isStatusMsg(message) &&
        message.content.execution_state === 'restarting'
      ) {
        resetExecutionStatus();
      } else if (message.header.msg_type === 'execute_input') {
        startTimer();
      }
    };

    const handleStatusChange = (): void => {
      executionStatusRef.current = {
        ...executionStatusRef.current,
        kernelStatus: sessionContext.kernelDisplayStatus
      };
      publishExecutionStatus();
    };

    const handleKernelChange = (
      sender: ISessionContext,
      kernelData: IChangedArgs<
        Kernel.IKernelConnection | null,
        Kernel.IKernelConnection | null,
        'kernel'
      >
    ): void => {
      if (kernelData.oldValue) {
        kernelData.oldValue.anyMessage.disconnect(handleAnyMessage);
      }
      if (kernelData.newValue) {
        kernelData.newValue.anyMessage.connect(handleAnyMessage);
      }
      resetExecutionStatus();
      handleStatusChange();
    };

    executionStatusRef.current = {
      ...createInitialExecutionStatus(),
      kernelStatus: sessionContext.kernelDisplayStatus
    };
    publishExecutionStatus();

    sessionContext.session?.kernel?.anyMessage.connect(handleAnyMessage);
    sessionContext.statusChanged.connect(handleStatusChange);
    sessionContext.connectionStatusChanged.connect(handleStatusChange);
    sessionContext.kernelChanged.connect(handleKernelChange);

    return () => {
      sessionContext.session?.kernel?.anyMessage.disconnect(handleAnyMessage);
      sessionContext.statusChanged.disconnect(handleStatusChange);
      sessionContext.connectionStatusChanged.disconnect(handleStatusChange);
      sessionContext.kernelChanged.disconnect(handleKernelChange);
      clearResetTimeout();
      clearIdleTimeout();
      clearTimer();
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

  const scheduledCellNumber = executionStatus.scheduledCellNumber || 0;
  const remainingCellNumber = executionStatus.scheduledCellIds.size || 0;
  const executedCellNumber = Math.max(0, scheduledCellNumber - remainingCellNumber);
  const hasScheduledCells = scheduledCellNumber > 0;
  const elapsedTimeLabel = executionStatus.totalTime

  const menuSections = [
    {
      title: 'Run Code',
      items: [
        {
          label: 'Run Current Cell',
          icon: SimplePlayIcon,
          shortcut: 'Shift+Enter',
          tooltip: 'Run the currently selected cell',
          onClick: () => {
            handleRunCurrentCell();
            setIsDropdownOpen(false);
          }
        },
        {
          label: 'Run All Cells',
          icon: RunAllIcon,
          tooltip: 'Run all cells in the notebook from top to bottom',
          onClick: () => {
            handleRunAllCells();
            setIsDropdownOpen(false);
          }
        },
        {
          label: 'Restart and Run All',
          icon: RestartAndRunIcon,
          tooltip: 'Restart the kernel to clear all variables and state, and then run all cells in the notebook',
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
          shortcut: '0, 0',
          tooltip: 'Restart the kernel, clearing all variables and state',
          onClick: () => {
            void handleRestart();
            setIsDropdownOpen(false);
          }
        },
        {
          label: 'Stop',
          icon: StopIcon,
          shortcut: 'I, I',
          tooltip: 'Interrupt the kernel to stop the currently running cell',
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
          tooltip: 'Clear all cell outputs in the notebook',
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
      <div className={classNames(
        'mito-run-cell-button-group',
        {'mito-run-cell-button-running': isRunning},
      )}
        onMouseEnter={() => setIsStatusPopupOpen(true)}
        onMouseLeave={() => setIsStatusPopupOpen(false)}
      >
        <button
          className="mito-run-cell-button mito-run-cell-button-main"
          onClick={handleMainButtonClick}
          title={isRunning ? "Running Cells" : "Run Active Cell"}
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
      {isRunning && isStatusPopupOpen && !isDropdownOpen && (
        <div
          className="mito-run-cell-status-popup"
          onMouseEnter={() => setIsStatusPopupOpen(true)}
          onMouseLeave={() => setIsStatusPopupOpen(false)}
        >
          <div className="mito-run-cell-status-popup-row">
            <span className="mito-run-cell-status-popup-label">Kernel status</span>
            <span className="mito-run-cell-status-popup-value">
              {getKernelStatusLabel(executionStatus.kernelStatus)}
            </span>
          </div>
          {hasScheduledCells && (
            <>
              <div className="mito-run-cell-status-popup-row">
                <span className="mito-run-cell-status-popup-label">Executed</span>
                <span className="mito-run-cell-status-popup-value">
                  {/* "cells" mirrors JupyterLab, but this count is really kernel execution requests, including Variable Manager requests. */}
                  {executedCellNumber}/{scheduledCellNumber} cells
                </span>
              </div>
              <div className="mito-run-cell-status-popup-row">
                <span className="mito-run-cell-status-popup-label">Elapsed Time (seconds) </span>
                <span className="mito-run-cell-status-popup-value">{elapsedTimeLabel}</span>
              </div>
            </>
          )}
        </div>
      )}
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
                  title={item.tooltip}
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
                  {item.shortcut && (
                    <span className="mito-run-cell-dropdown-item-shortcut">{item.shortcut}</span>
                  )}
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

