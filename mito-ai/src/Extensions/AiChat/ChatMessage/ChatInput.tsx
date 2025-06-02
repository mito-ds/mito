/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import { classNames } from '../../../utils/classNames';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import ChatDropdown from './ChatDropdown';
import { Variable } from '../../ContextManager/VariableInspector';
import { getActiveCellID, getCellCodeByID } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import PythonCode from './PythonCode';
import '../../../../style/ChatInput.css';
import '../../../../style/ChatDropdown.css';
import { useDebouncedFunction } from '../../../hooks/useDebouncedFunction';
import { ChatDropdownOption } from './ChatDropdown';
import SelectedContextContainer from '../../../components/SelectedContextContainer';

interface ChatInputProps {
    initialContent: string;
    placeholder: string;
    onSave: (content: string, index?: number, selectedRules?: string[]) => void;
    onCancel?: () => void;
    isEditing: boolean;
    contextManager?: IContextManager;
    notebookTracker: INotebookTracker;
    renderMimeRegistry: IRenderMimeRegistry;
    displayActiveCellCode?: boolean;
    agentModeEnabled: boolean;
}

export interface ExpandedVariable extends Variable {
    parent_df?: string;
    file_name?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
    initialContent,
    placeholder,
    onSave,
    onCancel,
    isEditing,
    contextManager,
    notebookTracker,
    renderMimeRegistry,
    displayActiveCellCode = true,
    agentModeEnabled = false,
}) => {

    const [input, setInput] = useState(initialContent);
    const [expandedVariables, setExpandedVariables] = useState<ExpandedVariable[]>([]);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [activeCellID, setActiveCellID] = useState<string | undefined>(getActiveCellID(notebookTracker));
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownFilter, setDropdownFilter] = useState('');
    const [selectedRules, setSelectedRules] = useState<string[]>([]);

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
        } else {
            setDropdownVisible(false);
            setDropdownFilter('');
        }
    };

    const handleOptionSelect = (option: ChatDropdownOption): void => {

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
        } else if (option.type === 'rule') {
            // We don't add the rule as an back ticked element in the chat input, 
            // and instead just add it as plain text because we also add it as 
            // a context container above the chat input and we want the user to 
            // delete the context from there if they want to. 
            contextChatRepresentation = option.rule
            setSelectedRules([...selectedRules, option.rule]);
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

    // If there are more than 8 lines, show the first 8 lines and add a "..."
    const activeCellCode = getCellCodeByID(notebookTracker, activeCellID) || ''
    const activeCellCodePreview = activeCellCode.split('\n').slice(0, 8).join('\n') + (
        activeCellCode.split('\n').length > 8 ? '\n\n# Rest of active cell code...' : '')

    return (
        <div 
            className={classNames("chat-input-container")}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
                setIsFocused(false)
            }}
        >
            {/* Show the active cell preview if the text area has focus or the user has started typing */}
            {selectedRules.length > 0 && (
                <div className='context-container'>
                    {selectedRules.map((rule) => (
                        <SelectedContextContainer
                            key={rule}
                            title={rule}
                            onRemove={() => setSelectedRules(selectedRules.filter((r) => r !== rule))}
                        />
                    ))}
                </div>
            )}
            {displayActiveCellCode && activeCellCodePreview.length > 0 && !agentModeEnabled
                && (isFocused || input.length > 0)
                && <div className='active-cell-preview-container' data-testid='active-cell-preview-container'>
                    <div className='code-block-container'>
                        <PythonCode
                            code={activeCellCodePreview}
                            renderMimeRegistry={renderMimeRegistry}
                        />
                    </div>
                </div>
            }
            
            {/* 
                Create a relative container for the text area and the dropdown so that when we 
                render the dropdown, it is relative to the text area instead of the entire 
                div. We do this so that the dropdown sits on top of (ie: covering) the code 
                preview instead of sitting higher up the taskpane.
            */}
            <div style={{ position: 'relative', height: 'min-content'}}>
                <textarea
                    ref={textAreaRef}
                    className={classNames("message", "message-user", 'chat-input', {"agent-mode": agentModeEnabled})}
                    placeholder={placeholder}
                    value={input}
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
                            onSave(input, undefined, selectedRules)

                            // Reset
                            setInput('')
                            setSelectedRules([])
                            setIsFocused(false)
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
                {isDropdownVisible  && (
                    <ChatDropdown
                        options={expandedVariables}
                        onSelect={handleOptionSelect}
                        filterText={dropdownFilter}
                    />
                )}
            </div>
            
            {isEditing &&
                <div className="message-edit-buttons">
                    <button onClick={() => onSave(input, undefined, selectedRules)}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            }
        </div>
    )
};

export default ChatInput;
