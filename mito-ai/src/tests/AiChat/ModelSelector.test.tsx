/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ModelSelector from '../../components/ModelSelector';

describe('ModelSelector', () => {
  const mockOnConfigChange = jest.fn();

  beforeEach(() => {
    // Clear mock calls before each test
    mockOnConfigChange.mockClear();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('calls onConfigChange when a model is selected', () => {
    render(<ModelSelector onConfigChange={mockOnConfigChange} />);
    
    // Open the dropdown
    const dropdown = screen.getByText('GPT-4.1').closest('.model-selector-dropdown');
    if (!dropdown) throw new Error('Dropdown element not found');
    fireEvent.click(dropdown);

    // Select a model (Claude 4 Opus)
    const modelOption = screen.getByText('Claude 4 Opus');
    fireEvent.click(modelOption);

    // Verify onConfigChange was called with correct model
    expect(mockOnConfigChange).toHaveBeenCalledWith({
      model: 'claude-opus-4-20250514'
    });
  });

  it('loads saved model from localStorage on mount', () => {
    // Set up localStorage with a saved model
    const savedConfig = {
      model: 'claude-sonnet-4-20250514'
    };
    localStorage.setItem('llmModelConfig', JSON.stringify(savedConfig));

    render(<ModelSelector onConfigChange={mockOnConfigChange} />);

    // Verify onConfigChange was called with saved model on mount
    expect(mockOnConfigChange).toHaveBeenCalledWith(savedConfig);
  });
}); 