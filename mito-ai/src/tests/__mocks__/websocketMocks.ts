/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export const createMockWebSocketClient = () => ({
  sendMessage: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(() => true),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
});