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
  'gpt-4o',
  'o3-mini',
  'claude-3-7-sonnet-latest',
  'claude-3-5-haiku-latest',
  'claude-3-5-sonnet-latest',
  'claude-3-opus-latest',
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

  // Load config from localStorage on component mount
  useEffect(() => {
    const storedConfig = localStorage.getItem('llmModelConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        setSelectedModel(parsedConfig.model || 'gpt-4o-mini');
      } catch (e) {
        console.error('Failed to parse stored LLM config', e);
      }
    }
  }, []);

  // Handle model selection change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    
    // Create a simplified config object
    const newConfig = {
      model: newModel
    };
    
    // Save to localStorage
    localStorage.setItem('llmModelConfig', JSON.stringify(newConfig));
    
    // Update environment variables based on model prefix
    if (newModel.startsWith('claude')) {
      localStorage.setItem('CLAUDE_MODEL', newModel);
    } else if (newModel.startsWith('gemini')) {
      localStorage.setItem('GEMINI_MODEL', newModel);
    } else if (newModel === 'ollama') {
      localStorage.setItem('OLLAMA_MODEL', newModel);
    }
    
    // Notify parent component
    onConfigChange(newConfig);
  };

  return (
    <div className="model-selector">
      <div className="model-selector-dropdown">
        <select
          value={selectedModel}
          onChange={handleModelChange}
          className="model-dropdown"
        >
          {ALL_MODELS.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ModelSelector;