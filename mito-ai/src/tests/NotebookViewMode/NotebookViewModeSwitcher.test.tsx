/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import NotebookViewModeSwitcher from '../../Extensions/NotebookViewMode/NotebookViewModeSwitcher';

describe('NotebookViewModeSwitcher', () => {
  it('renders as an accessible tablist', () => {
    render(
      <NotebookViewModeSwitcher mode="Notebook" onModeChange={jest.fn()} />
    );

    expect(screen.getByRole('tablist')).not.toBeNull();
    expect(
      screen.getByRole('tab', { name: 'Notebook' }).getAttribute('aria-selected')
    ).toBe('true');
    expect(
      screen.getByRole('tab', { name: 'Document' }).getAttribute('aria-selected')
    ).toBe('false');
    expect(
      screen.getByRole('tab', { name: 'App' }).getAttribute('aria-selected')
    ).toBe('false');
  });

  it('cycles modes with arrow keys', () => {
    const onModeChange = jest.fn();
    render(
      <NotebookViewModeSwitcher
        mode="Document"
        onModeChange={onModeChange}
      />
    );

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onModeChange).toHaveBeenCalledWith('App');

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
    expect(onModeChange).toHaveBeenCalledWith('Notebook');
  });

  it('moves focus and selected border together on arrow key navigation', () => {
    const Wrapper: React.FC = () => {
      const [mode, setMode] = React.useState<'Notebook' | 'Document' | 'App'>('Document');
      return <NotebookViewModeSwitcher mode={mode} onModeChange={setMode} />;
    };

    render(<Wrapper />);

    const documentTab = screen.getByRole('tab', { name: 'Document' });
    documentTab.focus();
    expect(documentTab).toHaveFocus();

    fireEvent.keyDown(documentTab, { key: 'ArrowRight' });
    const appTab = screen.getByRole('tab', { name: 'App' });
    expect(appTab).toHaveFocus();
    expect(appTab.getAttribute('aria-selected')).toBe('true');
  });

  it('disables all tabs when no notebook is active', () => {
    render(
      <NotebookViewModeSwitcher
        mode="Notebook"
        onModeChange={jest.fn()}
        disabled={true}
      />
    );

    expect(screen.getByRole('tablist').getAttribute('aria-disabled')).toBe(
      'true'
    );
    expect(
      (screen.getByRole('tab', { name: 'Notebook' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      (screen.getByRole('tab', { name: 'Document' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      (screen.getByRole('tab', { name: 'App' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
