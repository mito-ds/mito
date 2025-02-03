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
import { useDebouncedFunction } from '../../../hooks/useDebouncedFunction';
import AutoResizingTextArea from '../../../components/AutoResizingTextArea';

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
    const [isFocused, setIsFocused] = useState(false);
    const [activeCellID, setActiveCellID] = useState<string | undefined>(getActiveCellID(notebookTracker));
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownFilter, setDropdownFilter] = useState('');

    // Debounce the active cell ID change to avoid multiple rerenders. 
    // We use this to avoid a flickering screen when the active cell changes. 
    const debouncedSetActiveCellID = useDebouncedFunction((newID: string | undefined) => {
        setActiveCellID(newID);
    }, 100);

    useEffect(() => {
        const activeCellChangedListener = () => { 
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

    const handleInputChange = (value: string) => {
        setInput(value);

        const textArea = document.activeElement as HTMLTextAreaElement;
        const cursorPosition = textArea.selectionStart;
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
        const textarea = document.activeElement as HTMLTextAreaElement;
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
            const newCursorPosition = atIndex + variableNameWithBackticks.length;
            textarea.focus();
            textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
    };

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
            {activeCellCodePreview.length > 0 
                && (isFocused || input.length > 0)
                && <div className='active-cell-preview-container'>
                    <div className='code-block-container'>
                        <PythonCode
                            code={activeCellCodePreview}
                            renderMimeRegistry={renderMimeRegistry}
                        />
                    </div>
                </div>
            }
            
            <div style={{ position: 'relative', height: 'min-content'}}>
                <AutoResizingTextArea
                    initialContent={input}
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    onSave={(content) => {
                        onSave(content);
                        setInput('');
                        setIsFocused(false);
                    }}
                    onCancel={onCancel}
                    onKeyDown={(e) => {
                        // If dropdown is visible, only handle escape to close it
                        if (isDropdownVisible) {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                setDropdownVisible(false);
                            }
                            // Prevent default key handling when dropdown is visible
                            e.preventDefault();
                            return;
                        }
                    }}
                />
                {isDropdownVisible && (
                    <ChatDropdown
                        options={expandedVariables}
                        onSelect={handleOptionSelect}
                        filterText={dropdownFilter}
                    />
                )}
            </div>
            
            {isEditing &&
                <div className="message-edit-buttons">
                    <button onClick={() => onSave(input)}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            }
        </div>
    )
};

export default ChatInput;
