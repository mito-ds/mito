/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { IChatSessionState } from '../websockets/completions/CompletionModels';

const SESSION_STATE_KEY = 'mito_ai_chat_session_state';
const SESSION_STATE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Saves the current session state to localStorage.
 */
export function saveSessionState(state: IChatSessionState): void {
  try {
    const stateWithTimestamp = {
      ...state,
      lastSaved: Date.now()
    };
    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    console.warn('Failed to save session state to localStorage:', error);
  }
}

/**
 * Loads the session state from localStorage.
 * Returns null if no valid state is found or if the state has expired.
 */
export function loadSessionState(): IChatSessionState | null {
  try {
    const storedState = localStorage.getItem(SESSION_STATE_KEY);
    if (!storedState) {
      return null;
    }

    const parsedState: IChatSessionState = JSON.parse(storedState);
    
    // Check if the state has expired
    const now = Date.now();
    if (now - parsedState.lastSaved > SESSION_STATE_EXPIRY_MS) {
      // State has expired, remove it
      localStorage.removeItem(SESSION_STATE_KEY);
      return null;
    }

    return parsedState;
  } catch (error) {
    console.warn('Failed to load session state from localStorage:', error);
    // If there's an error, try to clear the corrupted state
    try {
      localStorage.removeItem(SESSION_STATE_KEY);
    } catch (clearError) {
      console.warn('Failed to clear corrupted session state:', clearError);
    }
    return null;
  }
}

/**
 * Clears the session state from localStorage.
 */
export function clearSessionState(): void {
  try {
    localStorage.removeItem(SESSION_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear session state from localStorage:', error);
  }
}

/**
 * Updates the current mode in the session state.
 */
export function updateSessionMode(mode: 'chat' | 'agent'): void {
  const currentState = loadSessionState();
  const newState: IChatSessionState = {
    activeThreadId: currentState?.activeThreadId,
    currentMode: mode,
    lastSaved: Date.now()
  };
  saveSessionState(newState);
}

/**
 * Updates the active thread ID in the session state.
 */
export function updateSessionActiveThread(threadId: string, mode?: 'chat' | 'agent'): void {
  const currentState = loadSessionState();
  const newState: IChatSessionState = {
    activeThreadId: threadId,
    currentMode: mode || currentState?.currentMode || 'agent',
    lastSaved: Date.now()
  };
  saveSessionState(newState);
}
