/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import '../../style/ModelSelector.css';
import NucleausIcon from '../icons/NucleausIcon';
import { CLAUDE_OPUS_DISPLAY_NAME, CLAUDE_OPUS_MODEL_NAME, CLAUDE_SONNET_DISPLAY_NAME, CLAUDE_SONNET_MODEL_NAME, GPT_DISPLAY_NAME, GPT_MODEL_NAME } from '../utils/models';

interface ModelConfig {
  model: string;
}

interface ModelMapping {
  displayName: string;
  fullName: string;
}

const MODEL_MAPPINGS: ModelMapping[] = [
  { displayName: GPT_DISPLAY_NAME, fullName: GPT_MODEL_NAME },
  { displayName: 'GPT 4.1', fullName: 'gpt-4.1' },
  { displayName: CLAUDE_OPUS_DISPLAY_NAME, fullName: CLAUDE_OPUS_MODEL_NAME },
  { displayName: CLAUDE_SONNET_DISPLAY_NAME, fullName: CLAUDE_SONNET_MODEL_NAME },
  { displayName: 'Gemini 2.5 Pro', fullName: 'gemini-2.5-pro-preview-03-25' }
];

const ALL_MODEL_DISPLAY_NAMES = MODEL_MAPPINGS.map(mapping => mapping.displayName);

// Maximum length for displayed model name before truncating
export const DEFAULT_MODEL = CLAUDE_SONNET_DISPLAY_NAME;

interface ModelSelectorProps {
  onConfigChange: (config: ModelConfig) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onConfigChange }) => {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Load config from localStorage on component mount and notify parent
  useEffect(() => {
    const storedConfig = localStorage.getItem('llmModelConfig');
    let fullModelName: string | undefined;
    let displayName: string | undefined;

    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        fullModelName = parsedConfig.model;
        displayName = MODEL_MAPPINGS.find(m => m.fullName === fullModelName)?.displayName;
      } catch (e) {
        console.error('Failed to parse stored LLM config', e);
      }
    }

    // Fallback to default if not found
    let defaultMapping = MODEL_MAPPINGS.find(m => m.displayName === DEFAULT_MODEL);
    if (!defaultMapping) {
      defaultMapping = MODEL_MAPPINGS[0];
    }
    if (!fullModelName || !displayName) {
      fullModelName = defaultMapping!.fullName;
      displayName = defaultMapping!.displayName;
    }

    setSelectedModel(displayName);
    onConfigChange({ model: fullModelName });
  }, [onConfigChange]);

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

  return (
    <div className="model-selector">
      <div
        className={`model-selector-dropdown`}
        onClick={() => setIsOpen(!isOpen)}
        title={selectedModel}
        data-testid="model-selector"
      >
        <div className="selected-model">
          <span className="model-icon">
            <NucleausIcon height={10} width={10} />
          </span>
          <span className="model-name">{selectedModel}</span>
          <span className="dropdown-arrow">▼</span>
        </div>
        {isOpen && (
          <div
            className={`model-options dropup`}
            style={{ minWidth: '150px' }}
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