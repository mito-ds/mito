/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import '../../style/ModelSelector.css';
import AIIcon from "../icons/AiIcon";

interface ModelConfig {
  model: string;
}

interface ModelMapping {
  displayName: string;
  fullName: string;
}

const MODEL_MAPPINGS: ModelMapping[] = [
  { displayName: 'GPT 4.1', fullName: 'gpt-4.1' },
  { displayName: 'Claude 4 Opus', fullName: 'claude-opus-4-20250514' },
  { displayName: 'Claude 4 Sonnet', fullName: 'claude-sonnet-4-20250514' },
  { displayName: 'Gemini 2.5 Pro', fullName: 'gemini-2.5-pro-preview-03-25' }
];

const ALL_MODEL_DISPLAY_NAMES = MODEL_MAPPINGS.map(mapping => mapping.displayName);

// Maximum length for displayed model name before truncating
export const DEFAULT_MODEL = 'GPT-4.1';

interface ModelSelectorProps {
  onConfigChange: (config: ModelConfig) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onConfigChange }) => {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const selectedModelRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load config from localStorage on component mount and notify parent
  useEffect(() => {
    const storedConfig = localStorage.getItem('llmModelConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        const fullModelName = parsedConfig.model || MODEL_MAPPINGS.find(m => m.displayName === DEFAULT_MODEL)?.fullName;
        const displayName = MODEL_MAPPINGS.find(m => m.fullName === fullModelName)?.displayName || DEFAULT_MODEL;
        setSelectedModel(displayName);

        onConfigChange({ model: fullModelName });
      } catch (e) {
        console.error('Failed to parse stored LLM config', e);
      }
    }
  }, [onConfigChange]);

  // Set up resize observer to detect container width changes
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        setIsCompact(containerWidth < 300);
      }
    });

    const chatControls = containerRef.current?.closest('.chat-controls');
    if (chatControls) {
      observer.observe(chatControls);
    }

    return () => observer.disconnect();
  }, []);

  const handleModelChange = (displayName: string): void => {
    setSelectedModel(displayName);
    setIsOpen(false);

    const fullModelName = MODEL_MAPPINGS.find(m => m.displayName === displayName)?.fullName || displayName;
    const newConfig = {
      model: fullModelName
    };

    localStorage.setItem('llmModelConfig', JSON.stringify(newConfig));

    // Notify parent component
    onConfigChange(newConfig);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;
      if (!target.closest('.model-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="model-selector" ref={containerRef}>
      <div
        className={`model-selector-dropdown ${isCompact ? 'compact-mode' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isCompact ? selectedModel : undefined}
        data-testid="model-selector"
      >
        <div className="selected-model">
          {isCompact ? (
            <span className="model-icon">
              <AIIcon width={14} height={14} />
            </span>
          ) : (
            <span
              ref={selectedModelRef}
              className="model-name"
              title={selectedModel} // Show full name on hover
            >
              {selectedModel}
            </span>
          )}
          <span className={`dropdown-arrow ${isCompact ? 'compact' : ''}`}>▼</span>
        </div>
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`model-options dropup ${isCompact ? 'from-icon' : ''}`}
            style={{ minWidth: isCompact ? '120px' : '150px' }}
          >
            {ALL_MODEL_DISPLAY_NAMES.map(model => (
              <div
                key={model}
                className={`model-option ${model === selectedModel ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModelChange(model);
                }}
                title={model} // Show full name on hover
                data-testid="model-option"
              >
                {model}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector;