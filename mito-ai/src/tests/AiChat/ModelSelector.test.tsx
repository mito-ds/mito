/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import ModelSelector from '../../components/ModelSelector';
import { DEFAULT_MODEL } from '../../components/ModelSelector';
import { 
  GPT_4_1_DISPLAY_NAME, 
  GPT_4_1_MODEL_NAME,
  GPT_5_2_MODEL_NAME,
  CLAUDE_SONNET_MODEL_NAME,
  CLAUDE_HAIKU_MODEL_NAME,
  GEMINI_3_FLASH_MODEL_NAME,
  GEMINI_3_PRO_MODEL_NAME,
} from '../../utils/models';

// Mock the requestAPI function
jest.mock('../../restAPI/utils', () => ({
    requestAPI: jest.fn()
}));

describe('ModelSelector', () => {
  const mockOnConfigChange = jest.fn();
  let mockRequestAPI: jest.Mock;

  beforeEach(() => {
    // Clear mock calls before each test
    mockOnConfigChange.mockClear();
    // Clear localStorage before each test
    localStorage.clear();
    
    // Get the mocked requestAPI
    const { requestAPI } = require('../../restAPI/utils');
    mockRequestAPI = requestAPI as jest.Mock;
    
    // Set up default mock implementation to return standard models
    mockRequestAPI.mockResolvedValue({
      data: {
        models: [
          GPT_4_1_MODEL_NAME,
          GPT_5_2_MODEL_NAME,
          CLAUDE_SONNET_MODEL_NAME,
          CLAUDE_HAIKU_MODEL_NAME,
          GEMINI_3_FLASH_MODEL_NAME,
          GEMINI_3_PRO_MODEL_NAME,
        ]
      }
    });
  });

  it('calls onConfigChange when a model is selected', async () => {
    render(<ModelSelector onConfigChange={mockOnConfigChange} />);
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.queryByText('Loading models...')).not.toBeInTheDocument();
    });
    
    // Open the dropdown
    const dropdown = screen.getByText(DEFAULT_MODEL).closest('.model-selector-dropdown');
    if (!dropdown) throw new Error('Dropdown element not found');
    fireEvent.click(dropdown);

    // Wait for the dropdown options to appear, then find the specific model option
    const modelOptionsContainer = await waitFor(() => {
      return screen.getByTestId('model-selector').querySelector('.model-options');
    });
    if (!modelOptionsContainer) throw new Error('Model options container not found');
    
    // Use within to scope the query to the dropdown options, avoiding the selected model display
    const modelOption = within(modelOptionsContainer as HTMLElement).getByText(GPT_4_1_DISPLAY_NAME);
    fireEvent.click(modelOption);

    // Verify onConfigChange was called with correct model
    expect(mockOnConfigChange).toHaveBeenCalledWith({
      model: GPT_4_1_MODEL_NAME
    });
  });

  it('loads saved model from localStorage on mount', async () => {
    // Set up localStorage with a saved model
    const savedConfig = {
      model: 'claude-sonnet-4-5-20250929'
    };
    localStorage.setItem('llmModelConfig', JSON.stringify(savedConfig));

    render(<ModelSelector onConfigChange={mockOnConfigChange} />);

    // Wait for models to load and onConfigChange to be called
    await waitFor(() => {
      expect(mockOnConfigChange).toHaveBeenCalledWith(savedConfig);
    });
  });

  it('defaults to default model when no storedConfig exists and GPT 4.1 is first in available models', async () => {
    // Mock models with GPT 4.1 first (simulating the bug scenario)
    mockRequestAPI.mockResolvedValue({
      data: {
        models: [
          GPT_4_1_MODEL_NAME,
          GPT_5_2_MODEL_NAME,
          CLAUDE_SONNET_MODEL_NAME,
          CLAUDE_HAIKU_MODEL_NAME,
          GEMINI_3_FLASH_MODEL_NAME,
          GEMINI_3_PRO_MODEL_NAME,
        ]
      }
    });

    // Ensure localStorage is empty (no storedConfig)
    localStorage.clear();

    render(<ModelSelector onConfigChange={mockOnConfigChange} />);

    // Wait for models to load
    await waitFor(() => {
      expect(screen.queryByText('Loading models...')).not.toBeInTheDocument();
    });

    // Verify that the default model (Haiku 4.5) is selected, not GPT 4.1
    expect(screen.getByText(DEFAULT_MODEL)).toBeInTheDocument();
    
    // Verify onConfigChange was called with Haiku model, not GPT 4.1
    await waitFor(() => {
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        model: CLAUDE_HAIKU_MODEL_NAME
      });
    });

    // Ensure it was NOT called with GPT 4.1
    expect(mockOnConfigChange).not.toHaveBeenCalledWith({
      model: GPT_4_1_MODEL_NAME
    });
  });
}); 