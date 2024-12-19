import React, { useState, useEffect } from 'react';
import { classNames } from '../../../utils/classNames';
import { IVariableManager } from '../../VariableManager/VariableManagerPlugin';
import ChatDropdown from './ChatDropdown';
import { Variable } from '../../VariableManager/VariableInspector';
import { getActiveCellID, getCellCodeByID } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import PythonCode from './PythonCode';
import '../../../../style/ChatInput.css';
import '../../../../style/ChatDropdown.css';

interface ChatInputProps {
    initialContent: string;
    placeholder: string;
    onSave: (content: string) => void;
    onCancel?: () => void;
    isEditing: boolean;
    variableManager?: IVariableManager;
    notebookTracker: INotebookTracker;
    renderMimeRegistry: IRenderMimeRegistry;
}

export interface ExpandedVariable extends Variable {
    parent_df?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
    initialContent,
    placeholder,
    onSave,
    onCancel,
    isEditing,
    variableManager,
    notebookTracker,
    renderMimeRegistry,
}) => {
    const [input, setInput] = useState(initialContent);
    const [expandedVariables, setExpandedVariables] = useState<ExpandedVariable[]>([]);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Add state to track active cell
    const [activeCellID, setActiveCellID] = useState<string | undefined>(getActiveCellID(notebookTracker));


    useEffect(() => {
        // Subscribe to active cell changes
        const activeCellChangedListener = () => { 
            const newActiveCellID = getActiveCellID(notebookTracker);
            setActiveCellID(newActiveCellID);
        };
    
        // When the activeCellChanged event occurs, it sometimes gets fired
        // many times. To avoid a bunch of rerenders, we disconnet the listener 
        // each time we use it and then recconect when we're done updating the active cell ID
        notebookTracker.activeCellChanged.connect(activeCellChangedListener);
    
        return () => {
            console.log("DISCONNECTING")
            notebookTracker.activeCellChanged.disconnect(activeCellChangedListener);
        };
    }, [notebookTracker, activeCellID]);  

    // State for the variable dropdown 
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownFilter, setDropdownFilter] = useState('');
    const [showDropdownAbove, setShowDropdownAbove] = useState(false);

    // TextAreas cannot automatically adjust their height based on the content that they contain, 
    // so instead we re-adjust the height as the content changes here. 
    const adjustHeight = (resetHeight: boolean = false) => {
        const textarea = textAreaRef?.current;
        if (!textarea) return;

        textarea.style.minHeight = 'auto';
        textarea.style.height = !textarea.value || resetHeight
            ? '40px' 
            : `${Math.max(40, textarea.scrollHeight)}px`;
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value;
        setInput(value);

        const cursorPosition = event.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPosition);
        const words = textBeforeCursor.split(/\s+/);
        const currentWord = words[words.length - 1];

        if (currentWord.startsWith("@")) {
            const query = currentWord.slice(1);
            setDropdownFilter(query);
            setDropdownVisible(true);
        } else {
            setDropdownVisible(false);
            setDropdownFilter('');
        }
    };

    const handleOptionSelect = (variableName: string, parentDf?: string) => {
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = input.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        const textAfterCursor = input.slice(cursorPosition);

        let variableNameWithBackticks: string;
        if (!parentDf) {
            variableNameWithBackticks = `\`${variableName}\``
        } else {
            variableNameWithBackticks = `\`${parentDf}['${variableName}']\``
        }

        const newValue =
            input.slice(0, atIndex) +
            variableNameWithBackticks +
            textAfterCursor;
        setInput(newValue);

        setDropdownVisible(false);

        // After updating the input value, set the cursor position after the inserted variable name
        // We use setTimeout to ensure this happens after React's state update
        setTimeout(() => {
            if (textarea) {
                const newCursorPosition = atIndex + variableNameWithBackticks.length;
                textarea.focus();
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 0);
    };

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value]);

    // Update the expandedVariables arr when the variable manager changes
    useEffect(() => {
        const expandedVariables: ExpandedVariable[] = [
            // Add base variables (excluding DataFrames)
            ...(variableManager?.variables.filter(variable => variable.type !== "pd.DataFrame") || []),
            // Add DataFrames
            ...(variableManager?.variables.filter((variable) => variable.type === "pd.DataFrame") || []),
            // Add series with parent DataFrame references
            ...(variableManager?.variables
                .filter((variable) => variable.type === "pd.DataFrame")
                .flatMap((df) =>
                    Object.entries(df.value).map(([seriesName, details]) => ({
                        variable_name: seriesName,
                        type: "col",
                        value: "replace_me",
                        parent_df: df.variable_name,
                    }))
                ) || [])
        ];
        setExpandedVariables(expandedVariables);
    }, [variableManager?.variables]);

    const calculateDropdownPosition = () => {
        if (!textAreaRef.current) return;

        const textarea = textAreaRef.current;
        const textareaRect = textarea.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - textareaRect.bottom;

        // If space below is less than 200px (typical dropdown height), show above
        setShowDropdownAbove(spaceBelow < 200);
    };

    useEffect(() => {
        if (isDropdownVisible) {
            calculateDropdownPosition();
        }
    }, [isDropdownVisible]);

    // If there are more than 8 lines, show the first 8 lines and add a "..."
    const activeCellCode = getCellCodeByID(notebookTracker, activeCellID || undefined) || ''
    const activeCellCodePreview = activeCellCode.split('\n').slice(0, 8).join('\n') + (
        activeCellCode.split('\n').length > 8 ? '\n\n# Rest of active cell code...' : '')

    return (
        <div style={{ position: 'relative' }}>
            {/* Show the active cell preview if the text area has focus or the user has started typing */}
            {activeCellCodePreview.length > 0 
                && (isFocused || input.length > 0)
                && <div className='active-cell-preview-container'>
                    <div className='code-message-part-container'>
                        <PythonCode
                            key={activeCellCodePreview}
                            code={activeCellCodePreview}
                            renderMimeRegistry={renderMimeRegistry}
                        />
                    </div>
                </div>
            }
            
            <textarea
                ref={textAreaRef}
                className={classNames("message", "message-user", 'chat-input')}
                placeholder={placeholder}
                value={input}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
                        onSave(input)
                        setInput('')
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
            {isEditing &&
                <div className="message-edit-buttons">
                    <button onClick={() => onSave(input)}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            }
            {isDropdownVisible && (
                <ChatDropdown
                    options={expandedVariables}
                    onSelect={handleOptionSelect}
                    filterText={dropdownFilter}
                    position={showDropdownAbove ? "above" : "below"}
                />
            )}
        </div>
    )
};

export default ChatInput;
