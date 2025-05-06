/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import '../../style/ModelSelector.css';

interface ModelConfig {
  model: string;
}

const ALL_MODELS = [
  'gpt-4.1',
  'o3-mini',
  // 'claude-3-7-sonnet-latest',
  // 'claude-3-5-haiku-latest',
  // 'claude-3-5-sonnet-latest',
  // 'claude-3-opus-latest',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro-preview-03-25',
  'gemini-1.5-flash',
  // 'ollama'
];

interface ModelSelectorProps {
  onConfigChange: (config: ModelConfig) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onConfigChange }) => {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Load config from localStorage on component mount and notify parent
  useEffect(() => {
    const storedConfig = localStorage.getItem('llmModelConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        const model = parsedConfig.model || 'gpt-4o-mini';
        setSelectedModel(model);

        // Notify parent component of initial model
        onConfigChange({ model });

      } catch (e) {
        console.error('Failed to parse stored LLM config', e);
      }
    }
  }, [onConfigChange]);

  // Handle model selection change
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setIsOpen(false);

    // Create a simplified config object
    const newConfig = {
      model: model
    };

    // Save to localStorage
    localStorage.setItem('llmModelConfig', JSON.stringify(newConfig));

    // Notify parent component
    onConfigChange(newConfig);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
        className="model-selector-dropdown"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="selected-model">
          <span>{selectedModel}</span>
          <span className="dropdown-arrow">▼</span>
        </div>
        {isOpen && (
          <div className="model-options dropup">
            {ALL_MODELS.map(model => (
              <div
                key={model}
                className={`model-option ${model === selectedModel ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModelChange(model);
                }}
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