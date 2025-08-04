/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import { classNames } from '../../../utils/classNames';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import ChatDropdown from './ChatDropdown';
import { Variable } from '../../ContextManager/VariableInspector';
import { getActiveCellID, getActiveCellCode } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import '../../../../style/ChatInput.css';
import '../../../../style/ChatDropdown.css';
import { useDebouncedFunction } from '../../../hooks/useDebouncedFunction';
import { ChatDropdownOption } from './ChatDropdown';
import SelectedContextContainer from '../../../components/SelectedContextContainer';
import DatabaseButton from '../../../components/DatabaseButton';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { AgentExecutionStatus } from '../ChatTaskpane';

interface ChatInputProps {
    app: JupyterFrontEnd;
    initialContent: string;
    placeholder: string;
    onSave: (content: string, index?: number, additionalContext?: Array<{ type: string, value: string }>) => void;
    onCancel?: () => void;
    isEditing: boolean;
    contextManager?: IContextManager;
    notebookTracker: INotebookTracker;
    agentModeEnabled: boolean;
    agentExecutionStatus?: AgentExecutionStatus;
}

export interface ExpandedVariable extends Variable {
    parent_df?: string;
    file_name?: string;
}

interface ContextItem {
    type: string;
    value: string;
    display?: string; // Optional display name, will fallback to value if not provided
}

const ChatInput: React.FC<ChatInputProps> = ({
    app,
    initialContent,
    placeholder,
    onSave,
    onCancel,
    isEditing,
    contextManager,
    notebookTracker,
    agentModeEnabled = false,
    agentExecutionStatus = 'idle',
}) => {
    const [input, setInput] = useState(initialContent);
    const [expandedVariables, setExpandedVariables] = useState<ExpandedVariable[]>([]);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
    const [activeCellID, setActiveCellID] = useState<string | undefined>(getActiveCellID(notebookTracker));
    const activeCellCode = getActiveCellCode(notebookTracker) || '';
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownFilter, setDropdownFilter] = useState('');
    const [additionalContext, setAdditionalContext] = useState<ContextItem[]>([]);
    const [isDropdownFromButton, setIsDropdownFromButton] = useState(false);

    // Debounce the active cell ID change to avoid multiple rerenders. 
    // We use this to avoid a flickering screen when the active cell changes. 
    const debouncedSetActiveCellID = useDebouncedFunction((newID: string | undefined) => {
        setActiveCellID(newID);
    }, 100);

    useEffect(() => {
        const activeCellChangedListener = (): void => {
            const newActiveCellID = getActiveCellID(notebookTracker);
            debouncedSetActiveCellID(newActiveCellID);
        };

        // Connect the listener once when the component mounts
        notebookTracker.activeCellChanged.connect(activeCellChangedListener);

        // Cleanup: disconnect the listener when the component unmounts
        return () => {
            notebookTracker.activeCellChanged.disconnect(activeCellChangedListener);
        };

    }, [notebookTracker, activeCellID, debouncedSetActiveCellID]);

    // TextAreas cannot automatically adjust their height based on the content that they contain, 
    // so instead we re-adjust the height as the content changes here. 
    const adjustHeight = (resetHeight: boolean = false): void => {
        const textarea = textAreaRef?.current;
        if (!textarea) return;

        textarea.style.minHeight = 'auto';
        textarea.style.height = !textarea.value || resetHeight
            ? '80px'
            : `${Math.max(80, textarea.scrollHeight)}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const value = event.target.value;
        setInput(value);

        const cursorPosition = event.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPosition);
        const words = textBeforeCursor.split(/\s+/);
        const currentWord = words[words.length - 1];

        if (currentWord && currentWord.startsWith("@")) {
            const query = currentWord.slice(1);
            setDropdownFilter(query);
            setDropdownVisible(true);
            setIsDropdownFromButton(false);
        } else {
            setDropdownVisible(false);
            setDropdownFilter('');
            setIsDropdownFromButton(false);
        }
    };

    const handleOptionSelect = (option: ChatDropdownOption): void => {
        if (isDropdownFromButton) {
            // When triggered by "Add Context" button, add to SelectedContextContainer
            if (option.type === 'variable') {
                // For variables, we'll add them as a special context type
                const contextName = option.variable.parent_df
                    ? `${option.variable.parent_df}.${option.variable.variable_name}`
                    : option.variable.variable_name;
                setAdditionalContext(prev => [...prev, { type: 'variable', value: contextName }]);
            } else if (option.type === 'file') {
                setAdditionalContext(prev => [...prev, { type: 'file', value: option.file.variable_name }]);
            } else if (option.type === 'rule') {
                setAdditionalContext(prev => [...prev, { type: 'rule', value: option.rule }]);
            } else if (option.type === 'db') {
                setAdditionalContext(prev => [
                    ...prev,
                    {
                        type: 'db',
                        value: option.variable.value,
                        display: option.variable.variable_name
                    }
                ]);
            }
            setDropdownVisible(false);

            // Use setTimeout to ensure this happens after React's state update cycle
            setTimeout(() => {
                textAreaRef.current?.focus();
            }, 0);
            return;
        }

        // Original behavior for @ dropdown - add to text input
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = input.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        const textAfterCursor = input.slice(cursorPosition);

        let contextChatRepresentation: string = ''

        if (option.type === 'variable') {

            if (option.variable.parent_df) {
                contextChatRepresentation = `\`${option.variable.variable_name}\``
            } else {
                contextChatRepresentation = `\`${option.variable.variable_name}\``
            }
        } else if (option.type === 'file') {
            // For files, add them as both back-ticked elements and the additional context container
            contextChatRepresentation = `\`${option.file.variable_name}\``
            setAdditionalContext([...additionalContext, { type: 'file', value: option.file.variable_name }]);
        } else if (option.type === 'rule') {
            // We don't add the rule as an back ticked element in the chat input, 
            // and instead just add it as plain text because we also add it as 
            // a context container above the chat input and we want the user to 
            // delete the context from there if they want to. 
            contextChatRepresentation = option.rule
            setAdditionalContext([...additionalContext, { type: 'rule', value: option.rule }]);
        } else if (option.type === 'db') {
            // For databases, add them as back-ticked elements
            contextChatRepresentation = `\`${option.variable.variable_name}\``
            setAdditionalContext([
                ...additionalContext,
                { type: 'db', value: option.variable.value, display: option.variable.variable_name }
            ]);
        }

        const newValue =
            input.slice(0, atIndex) +
            contextChatRepresentation +
            textAfterCursor;
        setInput(newValue);

        setDropdownVisible(false);

        // After updating the input value, set the cursor position after the inserted variable name
        // We use setTimeout to ensure this happens after React's state update
        setTimeout(() => {
            if (textarea) {
                const newCursorPosition = atIndex + contextChatRepresentation.length;
                textarea.focus();
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 0);
    };

    const handleDropdownClose = (): void => {
        setDropdownVisible(false);
        setDropdownFilter('');
        setIsDropdownFromButton(false);
    };

    const mapAdditionalContext = (): Array<{ type: string, value: string }> => {
        return additionalContext.map(context => {
            if (context.type === 'db') {
                return {
                    type: context.type,
                    value: context.value
                };
            }
            return context;
        });
    };

    // Update the expandedVariables arr when the variable manager changes
    useEffect(() => {
        const expandedVariables: ExpandedVariable[] = [
            // Add base variables (excluding DataFrames)
            ...(contextManager?.variables.filter(variable => variable.type !== "pd.DataFrame") || []),
            // Add DataFrames
            ...(contextManager?.variables.filter((variable) => variable.type === "pd.DataFrame") || []),
            // Add series with parent DataFrame references
            ...(contextManager?.variables
                .filter((variable) => variable.type === "pd.DataFrame")
                .flatMap((df) =>
                    Object.entries(df.value).map(([seriesName, _]) => ({
                        variable_name: seriesName,
                        type: "col",
                        value: "replace_me",
                        parent_df: df.variable_name,
                    }))
                ) || []),
            // Add files
            ...(contextManager?.files.map(file => ({
                variable_name: file.file_name,
                type: file.file_name.split('.').pop()?.toLowerCase() || '',
                value: file.file_name,
                file_name: file.file_name
            })) || [])
        ];
        setExpandedVariables(expandedVariables);
    }, [contextManager?.variables, contextManager?.files]);

    // Automatically add active cell context when in Chat mode and there's active cell code
    useEffect(() => {
        if (!agentModeEnabled) {
            // Check if active cell context is already present
            const hasActiveCellContext = additionalContext.some(context => context.type === 'active_cell');

            if (!hasActiveCellContext) {
                setAdditionalContext(prev => [...prev, {
                    type: 'active_cell',
                    value: 'Active Cell',
                    display: 'Active Cell'
                }]);
            }
        } else if (agentModeEnabled) {
            // Remove active cell context when in agent mode
            const hasActiveCellContext = additionalContext.some(context => context.type === 'active_cell');
            if (hasActiveCellContext) {
                setAdditionalContext(prev => prev.filter(context => context.type !== 'active_cell'));
            }
        }
    }, [agentModeEnabled, additionalContext, activeCellCode]);

    return (
        <div
            className={classNames("chat-input-container")}
        >
            <div className='context-container'>
                <DatabaseButton app={app} />
                <button
                    className="context-button"
                    onClick={() => {
                        setDropdownVisible(true);
                        setDropdownFilter('');
                        setIsDropdownFromButton(true);
                        textAreaRef.current?.focus();
                    }}
                >
                    ＠ Add Context
                </button>
                {additionalContext.map((context, index) => (
                    <SelectedContextContainer
                        key={`${context.type}-${context.value}-${index}`}
                        title={context.type === 'db' && context.display ? context.display : context.value}
                        type={context.type}
                        onRemove={() => setAdditionalContext(additionalContext.filter((_, i) => i !== index))}
                        notebookTracker={notebookTracker}
                        activeCellID={activeCellID}
                    />
                ))}
            </div>

            {/* 
                Create a relative container for the text area and the dropdown so that when we 
                render the dropdown, it is relative to the text area instead of the entire 
                div. We do this so that the dropdown sits on top of (ie: covering) the code 
                preview instead of sitting higher up the taskpane.
            */}
            <div className='chat-input-text-area-container'>
                <textarea
                    ref={textAreaRef}
                    className={classNames("message", "message-user", 'chat-input', { "agent-mode": agentModeEnabled })}
                    placeholder={placeholder}
                    value={input}
                    disabled={agentExecutionStatus === 'working' || agentExecutionStatus === 'stopping'}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        // If dropdown is visible, only handle escape to close it
                        if (isDropdownVisible) {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                setDropdownVisible(false);
                            }
                            return;
                        }

                        // Enter key sends the message, but we still want to allow 
                        // shift + enter to add a new line.
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            adjustHeight(true)
                            onSave(input, undefined, mapAdditionalContext())

                            // Reset
                            setInput('')
                            setAdditionalContext([])
                        }
                        // Escape key cancels editing
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            if (onCancel) {
                                onCancel();
                            }
                        }
                    }}
                />
                {isDropdownVisible && (
                    <ChatDropdown
                        options={expandedVariables}
                        onSelect={handleOptionSelect}
                        filterText={dropdownFilter}
                        isDropdownFromButton={isDropdownFromButton}
                        onFilterChange={setDropdownFilter}
                        onClose={handleDropdownClose}
                    />
                )}
            </div>

            {isEditing &&
                <div className="message-edit-buttons">
                    <button onClick={() => onSave(input, undefined, mapAdditionalContext())}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            }
        </div>
    )
};

export default ChatInput;
