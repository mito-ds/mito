/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import '../../style/ModelSelector.css';
import NucleausIcon from '../icons/NucleausIcon';
import BrainIcon from '../icons/BrainIcon';
import LightningIcon from '../icons/LightningIcon';
import { 
  CLAUDE_SONNET_DISPLAY_NAME, 
  CLAUDE_SONNET_MODEL_NAME, 
  CLAUDE_HAIKU_DISPLAY_NAME, 
  CLAUDE_HAIKU_MODEL_NAME,
  GPT_4_1_DISPLAY_NAME,
  GPT_4_1_MODEL_NAME,
  GPT_5_2_DISPLAY_NAME,
  GPT_5_2_MODEL_NAME,
  GEMINI_3_FLASH_MODEL_NAME,
  GEMINI_3_FLASH_DISPLAY_NAME,
  GEMINI_3_PRO_DISPLAY_NAME,
  GEMINI_3_PRO_MODEL_NAME,
} from '../utils/models';

interface ModelConfig {
  model: string;
}

interface ModelMapping {
  displayName: string;
  fullName: string;
  type?: 'smart' | 'fast'; // 'smart' shows brain icon, 'fast' shows lightning icon
  goodFor: string[]; // Array of use cases for bullet points
  provider: string;
  tokenLimit: string;
  speed: 'Fast' | 'Medium' | 'Slow';
  complexityHandling: 'High' | 'Medium' | 'Low';
}

const GOOD_FOR_FAST = [
  'Quick data exploration',
  'Pandas operations',
  'Basic data cleaning',
  'Fast code iterations'
]

const GOOD_FOR_SMART = [
  'Complex data analysis',
  'Advanced debugging',
  'Statistical analysis and modeling',
  'Multi-step data workflows'
]

const MODEL_MAPPINGS: ModelMapping[] = [
  {
    displayName: GPT_4_1_DISPLAY_NAME,
    fullName: GPT_4_1_MODEL_NAME,
    type: 'smart',
    goodFor: [...GOOD_FOR_SMART],
    provider: 'OpenAI',
    tokenLimit: '1M',
    speed: 'Medium',
    complexityHandling: 'High'
  },
  {
    displayName: GPT_5_2_DISPLAY_NAME,
    fullName: GPT_5_2_MODEL_NAME,
    type: 'fast',
    goodFor: [...GOOD_FOR_FAST],
    provider: 'OpenAI',
    tokenLimit: '400K',
    speed: 'Fast',
    complexityHandling: 'Medium'
  },
  {
    displayName: CLAUDE_HAIKU_DISPLAY_NAME,
    fullName: CLAUDE_HAIKU_MODEL_NAME,
    type: 'fast',
    goodFor: [
      'Quick data exploration',
      'Pandas operations',
      'Basic data cleaning',
      'Fast code iterations'
    ],
    provider: 'Anthropic',
    tokenLimit: '200K',
    speed: 'Fast',
    complexityHandling: 'Medium'
  },
  {
    displayName: CLAUDE_SONNET_DISPLAY_NAME,
    fullName: CLAUDE_SONNET_MODEL_NAME,
    type: 'smart',
    goodFor: [...GOOD_FOR_SMART],
    provider: 'Anthropic',
    tokenLimit: '1M',
    speed: 'Medium',
    complexityHandling: 'High'
  },
  {
    displayName: GEMINI_3_FLASH_DISPLAY_NAME,
    fullName: GEMINI_3_FLASH_MODEL_NAME,
    type: 'fast',
    goodFor: [...GOOD_FOR_FAST],
    provider: 'Google',
    tokenLimit: '1M',
    speed: 'Fast',
    complexityHandling: 'Medium'
  },
  {
    displayName: GEMINI_3_PRO_DISPLAY_NAME,
    fullName: GEMINI_3_PRO_MODEL_NAME,
    type: 'smart',
    goodFor: [...GOOD_FOR_SMART],
    provider: 'Google',
    tokenLimit: '1M',
    speed: 'Slow',
    complexityHandling: 'High'
  }
];

const ALL_MODEL_DISPLAY_NAMES = MODEL_MAPPINGS.map(mapping => mapping.displayName);

// Maximum length for displayed model name before truncating
export const DEFAULT_MODEL = CLAUDE_HAIKU_DISPLAY_NAME;

interface ModelSelectorProps {
  onConfigChange: (config: ModelConfig) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onConfigChange }) => {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hoveredModel, setHoveredModel] = useState<ModelMapping | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Set CSS custom properties for tooltip positioning
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      // Align bottom of tooltip with bottom of dropdown (which is at rect.top)
      // Tooltip height is approximately 180px
      const tooltipHeight = 180;
      const tooltipBottom = rect.top;
      const tooltipTop = tooltipBottom - tooltipHeight;

      document.documentElement.style.setProperty('--tooltip-top', `${tooltipTop - 32}px`);
      document.documentElement.style.setProperty('--tooltip-left', `${rect.left + 160}px`);
    }
  }, [isOpen]);

  return (
    <div className="model-selector">
      <div
        ref={dropdownRef}
        className={`model-selector-dropdown`}
        onClick={() => setIsOpen(!isOpen)}
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
            onMouseLeave={() => setHoveredModel(null)}
          >
            {ALL_MODEL_DISPLAY_NAMES.map(model => {
              const modelMapping = MODEL_MAPPINGS.find(m => m.displayName === model);
              return (
                <div
                  key={model}
                  className={`model-option ${model === selectedModel ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModelChange(model);
                  }}
                  onMouseEnter={() => setHoveredModel(modelMapping || null)}
                  data-testid="model-option"
                >
                  <span className="model-option-name">{model}</span>
                  {modelMapping?.type === 'smart' && (
                    <span className="model-type-icon">
                      <BrainIcon height={12} width={12} />
                    </span>
                  )}
                  {modelMapping?.type === 'fast' && (
                    <span className="model-type-icon">
                      <LightningIcon height={12} width={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {isOpen && hoveredModel && ReactDOM.createPortal(
        <div
          className="model-tooltip">
          <div className="model-tooltip-content">
            <div className="model-tooltip-header">
              <div className="model-tooltip-title-row">
                <span className="model-tooltip-title-icon">
                  {hoveredModel.type === 'smart' ? (
                    <BrainIcon height={16} width={16} />
                  ) : (
                    <LightningIcon height={16} width={16} />
                  )}
                </span>
                <div className="model-tooltip-title">{hoveredModel.displayName}</div>
              </div>
              <div className="model-tooltip-metadata">
                <div className="model-tooltip-metadata-item">
                  <span className="model-tooltip-metadata-label">Provider:</span>
                  <span className="model-tooltip-metadata-value">{hoveredModel.provider}</span>
                </div>
                <div className="model-tooltip-metadata-item">
                  <span className="model-tooltip-metadata-label">Tokens:</span>
                  <span className="model-tooltip-metadata-value">{hoveredModel.tokenLimit}</span>
                </div>
                <div className="model-tooltip-metadata-item">
                  <span className="model-tooltip-metadata-label">Speed:</span>
                  <span className="model-tooltip-metadata-value">{hoveredModel.speed}</span>
                </div>
                <div className="model-tooltip-metadata-item">
                  <span className="model-tooltip-metadata-label">Complexity:</span>
                  <span className="model-tooltip-metadata-value">{hoveredModel.complexityHandling}</span>
                </div>
              </div>
            </div>
            <div className="model-tooltip-section">
              <div className="model-tooltip-section-label">Good For:</div>
              <ul className="model-tooltip-bullet-list">
                {hoveredModel.goodFor.map((item, index) => (
                  <li key={index} className="model-tooltip-bullet-item">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ModelSelector;