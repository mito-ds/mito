/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AppsList } from '../../Extensions/AppManager/apps-list';
import { IAppManagerService } from '../../Extensions/AppManager/ManageAppsPlugin';
import { App, GetAppsResponse } from '../../Extensions/AppManager/list-apps-api';

// Mock the auth module
jest.mock('../../Extensions/AppBuilder/auth', () => ({
  logoutAndClearJWTTokens: jest.fn()
}));

// Mock the copyToClipboard utility
const mockCopyToClipboard = jest.fn();
jest.mock('../../../utils/copyToClipboard', () => ({
  __esModule: true,
  default: mockCopyToClipboard
}));

// Mock the copyIcon
jest.mock('@jupyterlab/ui-components', () => ({
  copyIcon: {
    react: ({ width, height, fill }: any) => (
      <svg width={width} height={height} fill={fill} data-testid="copy-icon">
        Copy
      </svg>
    )
  }
}));

// Create mock app manager service
const createMockAppManagerService = (): IAppManagerService => ({
  client: {
    sendMessage: jest.fn(),
    serverSettings: {
      token: 'mock-token'
    }
  } as any
});

// Mock data
const mockApps: App[] = [
  {
    id: '1',
    name: 'Test App 1',
    url: 'https://test1.example.com',
    status: 'running',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Test App 2',
    url: 'https://test2.example.com',
    status: 'stopped',
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'Test App 3',
    url: 'https://test3.example.com',
    status: 'deploying',
    createdAt: '2024-01-03T00:00:00Z'
  }
];

const mockSuccessResponse: GetAppsResponse = {
  apps: mockApps,
  success: true
};

const mockErrorResponse: GetAppsResponse = {
  apps: [],
  success: false,
  message: 'Failed to load apps'
};

describe('AppsList Component', () => {
  let mockAppManagerService: IAppManagerService;
  let mockFetchUserApps: jest.MockedFunction<typeof import('../../Extensions/AppManager/list-apps-api').fetchUserApps>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppManagerService = createMockAppManagerService();
    
    // Mock the fetchUserApps function
    jest.doMock('../../Extensions/AppManager/list-apps-api', () => ({
      fetchUserApps: jest.fn()
    }));
    
    const apiModule = require('../../Extensions/AppManager/list-apps-api');
    mockFetchUserApps = apiModule.fetchUserApps as jest.MockedFunction<typeof apiModule.fetchUserApps>;
  });

  describe('Rendering States', () => {
    test('should render loading state initially', () => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      expect(screen.getByText('Loading apps...')).toBeInTheDocument();
    });

    test('should render apps list when data loads successfully', async () => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument();
        expect(screen.getByText('Test App 2')).toBeInTheDocument();
        expect(screen.getByText('Test App 3')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Loading apps...')).not.toBeInTheDocument();
    });

    test('should render empty state when no apps', async () => {
      mockFetchUserApps.mockResolvedValue({
        apps: [],
        success: true
      });
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('No apps deployed yet')).toBeInTheDocument();
      });
    });

    test('should render error state when API call fails', async () => {
      mockFetchUserApps.mockResolvedValue(mockErrorResponse);
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load apps')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('should render error state when API throws exception', async () => {
      mockFetchUserApps.mockRejectedValue(new Error('Network error'));
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('App Item Display', () => {
    beforeEach(() => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
    });

    test('should display app name correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument();
        expect(screen.getByText('Test App 2')).toBeInTheDocument();
      });
    });

    test('should display app URL correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('https://test1.example.com')).toBeInTheDocument();
        expect(screen.getByText('https://test2.example.com')).toBeInTheDocument();
      });
    });

    test('should display app status correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Running')).toBeInTheDocument();
        expect(screen.getByText('Stopped')).toBeInTheDocument();
        expect(screen.getByText('Deploying')).toBeInTheDocument();
      });
    });

    test('should display creation date correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Created: 2024-01-01T00:00:00Z')).toBeInTheDocument();
        expect(screen.getByText('Created: 2024-01-02T00:00:00Z')).toBeInTheDocument();
      });
    });

    test('should display copy button for each app', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        const copyButtons = screen.getAllByTestId('copy-icon');
        expect(copyButtons).toHaveLength(3);
      });
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
      mockCopyToClipboard.mockResolvedValue(true);
    });

    test('should call copyToClipboard when copy button is clicked', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument();
      });
      
      const copyButton = screen.getByTestId('copy-icon');
      fireEvent.click(copyButton);
      
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        'https://test1.example.com',
        'Test App 1'
      );
    });

  });
  

  describe('Edge Cases', () => {
    test('should handle apps with missing optional fields', async () => {
      const incompleteApps = [
        {
          id: '1',
          name: 'Incomplete App',
          url: 'https://incomplete.example.com',
          status: 'running' as const,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      mockFetchUserApps.mockResolvedValue({
        apps: incompleteApps,
        success: true
      });
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete App')).toBeInTheDocument();
        expect(screen.getByText('https://incomplete.example.com')).toBeInTheDocument();
      });
    });

    test('should handle very long URLs gracefully', async () => {
      const longUrlApp = {
        id: '1',
        name: 'Long URL App',
        url: 'https://very-long-subdomain-name-that-might-cause-layout-issues.example.com/very/deep/path/with/many/segments',
        status: 'running' as const,
        createdAt: '2024-01-01T00:00:00Z'
      };
      
      mockFetchUserApps.mockResolvedValue({
        apps: [longUrlApp],
        success: true
      });
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText(longUrlApp.url)).toBeInTheDocument();
      });
    });
  });
});
