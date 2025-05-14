/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import '../../style/ModelSelector.css';
// Import the AI icon image
// Note: You'll need to adjust this import path to match your project structure
import AIIcon from "../icons/AiIcon";

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

// Maximum length for displayed model name before truncating
const MAX_MODEL_NAME_LENGTH = 18;

interface ModelSelectorProps {
  onConfigChange: (config: ModelConfig) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onConfigChange }) => {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownWidth, setDropdownWidth] = useState<number>(0);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const selectedModelRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load config from localStorage on component mount and notify parent
  useEffect(() => {
    const storedConfig = localStorage.getItem('llmModelConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        const model = parsedConfig.model || 'gpt-4o-mini';
        setSelectedModel(model);

        onConfigChange({ model });

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

  useEffect(() => {
    if (selectedModelRef.current && !isCompact) {
      const textWidth = selectedModelRef.current.scrollWidth;
      setDropdownWidth(Math.min(textWidth + 30, 150)); // Set a maximum width of 150px
    } else if (isCompact) {setDropdownWidth(28);
    }
  }, [selectedModel, isCompact]);

  // Shorten model name if it's too long
  const truncateModelName = (name: string): string => {
    if (name.length > MAX_MODEL_NAME_LENGTH) {
      return `${name.substring(0, MAX_MODEL_NAME_LENGTH - 3)}...`;
    }
    return name;
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setIsOpen(false);

    const newConfig = {
      model: model
    };

    localStorage.setItem('llmModelConfig', JSON.stringify(newConfig));

    // Notify parent component
    onConfigChange(newConfig);
  };

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

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current && containerRef.current) {
      const dropdown = dropdownRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      if (rect.top < dropdown.offsetHeight) {
        dropdown.style.bottom = 'auto';
        dropdown.style.top = '100%';
        dropdown.style.marginTop = '4px';
        dropdown.style.marginBottom = '0';
      } else {
        // Default: position above
        dropdown.style.top = 'auto';
        dropdown.style.bottom = '100%';
        dropdown.style.marginBottom = '4px';
        dropdown.style.marginTop = '0';
      }

      // Ensure it doesn't overflow horizontally
      if (isCompact) {
        const leftSpace = rect.left;
        const rightSpace = window.innerWidth - rect.right;

        if (leftSpace < (dropdown.offsetWidth / 2) || rightSpace < (dropdown.offsetWidth / 2)) {
          // Not enough space to center, align to the side with more space
          if (leftSpace < rightSpace) {
            dropdown.style.left = '0';
            dropdown.style.right = 'auto';
            dropdown.style.transform = 'none';
          } else {
            dropdown.style.left = 'auto';
            dropdown.style.right = '0';
            dropdown.style.transform = 'none';
          }
        } else {
          dropdown.style.left = '50%';
          dropdown.style.right = 'auto';
          dropdown.style.transform = 'translateX(-50%)';
        }
      }
    }
  }, [isOpen, isCompact]);

  return (
    <div className="model-selector" ref={containerRef}>
      <div
        className={`model-selector-dropdown ${isCompact ? 'compact-mode' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: `${dropdownWidth}px` }}
        title={isCompact ? selectedModel : undefined}
      >
        <div className="selected-model">
          {isCompact ? (
            <span className="model-icon">
              <AIIcon width={14} height={14} />
            </span>
          ) : (
            <span
              ref={selectedModelRef}
              title={selectedModel} // Show full name on hover
            >
              {truncateModelName(selectedModel)}
            </span>
          )}
          <span className={`dropdown-arrow ${isCompact ? 'compact' : ''}`}>▼</span>
        </div>
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`model-options dropup ${isCompact ? 'from-icon' : ''}`}
            style={{ minWidth: isCompact ? '120px' : `${dropdownWidth}px` }}
          >
            {ALL_MODELS.map(model => (
              <div
                key={model}
                className={`model-option ${model === selectedModel ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModelChange(model);
                }}
                title={model} // Show full name on hover
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